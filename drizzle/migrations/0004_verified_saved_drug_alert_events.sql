CREATE TABLE public.nadac_alert_delivery_state(id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), activated_at timestamptz);
GRANT ALL ON public.nadac_alert_delivery_state TO service_role;
ALTER TABLE public.nadac_alert_delivery_state ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.nadac_saved_drug_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),run_id uuid NOT NULL REFERENCES public.nadac_import_runs(id),saved_drug_id uuid NOT NULL,user_id uuid NOT NULL,content jsonb NOT NULL,in_app_alert_id uuid,queued_at timestamptz,UNIQUE(run_id,saved_drug_id));
GRANT SELECT ON public.nadac_saved_drug_events TO authenticated;
GRANT ALL ON public.nadac_saved_drug_events TO service_role;
ALTER TABLE public.nadac_saved_drug_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins inspect saved drug events" ON public.nadac_saved_drug_events FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.nadac_saved_alert_preview(p_saved uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; p nadac_import_runs; s saved_drugs; pref profiles; c nadac_release_records; old nadac_release_records; cutoff timestamptz; reason text; pct numeric;
BEGIN
 SELECT * INTO s FROM saved_drugs WHERE id=p_saved;
 IF NOT FOUND THEN RETURN jsonb_build_object('reason','saved_drug_missing'); END IF;
 SELECT * INTO pref FROM profiles WHERE user_id=s.user_id;
 SELECT x.* INTO r FROM nadac_publication b JOIN nadac_import_runs x ON x.id=b.current_run_id WHERE b.id=1;
 SELECT * INTO p FROM nadac_import_runs WHERE id=r.previous_run_id;
 SELECT * INTO c FROM nadac_release_records WHERE run_id=r.id AND ndc=s.ndc;
 SELECT * INTO old FROM nadac_release_records WHERE run_id=p.id AND ndc=s.ndc;
 SELECT activated_at INTO cutoff FROM nadac_alert_delivery_state WHERE id=1;
 IF r.id IS NULL THEN reason='publication_missing';
 ELSIF r.status<>'completed' OR r.completed_at IS NULL OR r.failure_reason IS NOT NULL OR r.search_status<>'completed' OR r.movers_status<>'completed' OR r.homepage_status<>'completed' OR r.digest_status<>'completed' OR r.freshness_status<>'completed' THEN reason='release_incomplete';
 ELSIF EXISTS(SELECT 1 FROM nadac_import_runs WHERE source_date>r.source_date) THEN reason='newer_release_exists';
 ELSIF r.source_date>CURRENT_DATE OR r.source_date<CURRENT_DATE-7 THEN reason='stale_release';
 ELSIF r.historical OR r.baseline THEN reason='historical_release';
 ELSIF p.id IS NULL OR p.status<>'completed' OR p.source_date<>r.source_date-7 OR p.record_count<>p.expected_count OR p.search_status<>'completed' THEN reason='previous_release_incomplete';
 ELSIF r.record_count<>r.expected_count OR NOT EXISTS(SELECT 1 FROM weekly_movers WHERE run_id=r.id AND effective_date=r.source_date AND previous_date=p.source_date AND total_changed=r.total_changed) THEN reason='comparison_incomplete';
 ELSIF c.ndc IS NULL OR old.ndc IS NULL THEN reason='record_missing';
 ELSIF c.ndc<>old.ndc OR c.drug_name<>old.drug_name OR c.pricing_unit<>old.pricing_unit OR c.pharmacy_type<>old.pharmacy_type OR c.pricing_unit='' OR c.pharmacy_type='' OR old.nadac_per_unit<=0 OR c.nadac_per_unit<=0 THEN reason='non_comparable';
 ELSIF c.nadac_per_unit=old.nadac_per_unit THEN reason='unchanged';
 ELSIF NOT s.alerts_enabled THEN reason='alerts_disabled';
 ELSIF s.created_at>r.started_at THEN reason='saved_after_release';
 ELSIF pref.id IS NULL THEN reason='preferences_missing';
 ELSE
 pct=(c.nadac_per_unit-old.nadac_per_unit)/old.nadac_per_unit*100;
 IF pref.notify_large_changes_only AND (pref.large_change_threshold IS NULL OR pref.large_change_threshold<0 OR abs(pct)<pref.large_change_threshold) THEN reason='below_threshold';
 ELSIF cutoff IS NULL THEN reason='delivery_not_activated';
 ELSIF r.started_at<cutoff THEN reason='before_activation'; END IF;
 END IF;
 RETURN jsonb_build_object('reason',reason,'runId',r.id,'savedDrugId',s.id,'userId',s.user_id,'ndc',s.ndc,'drugName',c.drug_name,'pricingUnit',c.pricing_unit,'pharmacyType',c.pharmacy_type,'previousDate',p.source_date,'currentDate',r.source_date,'oldPrice',old.nadac_per_unit::text,'newPrice',c.nadac_per_unit::text,'changePercent',pct::text,'emailPreference',pref.notify_saved_drugs);
END $$;
CREATE FUNCTION public.nadac_prepare_saved_alert(p_saved uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v jsonb; e nadac_saved_drug_events; alert_id uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 v=public.nadac_saved_alert_preview(p_saved);
 IF v->>'reason' IS NOT NULL THEN RAISE EXCEPTION 'Saved alert blocked: %',v->>'reason'; END IF;
 INSERT INTO nadac_saved_drug_events(run_id,saved_drug_id,user_id,content) VALUES((v->>'runId')::uuid,p_saved,(v->>'userId')::uuid,v) ON CONFLICT(run_id,saved_drug_id) DO NOTHING;
 SELECT * INTO e FROM nadac_saved_drug_events WHERE run_id=(v->>'runId')::uuid AND saved_drug_id=p_saved FOR UPDATE;
 IF e.in_app_alert_id IS NULL THEN
 INSERT INTO price_alerts(user_id,saved_drug_id,ndc,drug_name,old_price,new_price,price_change_percent) VALUES(e.user_id,p_saved,v->>'ndc',v->>'drugName',(v->>'oldPrice')::numeric,(v->>'newPrice')::numeric,(v->>'changePercent')::numeric) RETURNING id INTO alert_id;
 UPDATE nadac_saved_drug_events SET in_app_alert_id=alert_id WHERE id=e.id; END IF;
 RETURN e.id;
END $$;
CREATE FUNCTION public.nadac_enqueue_saved_alert(p_event uuid,p_payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e nadac_saved_drug_events; v jsonb; queue_id bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 SELECT * INTO e FROM nadac_saved_drug_events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown saved alert event'; END IF;
 IF e.queued_at IS NOT NULL THEN RETURN jsonb_build_object('queued',false,'duplicate',true); END IF;
 v=public.nadac_saved_alert_preview(e.saved_drug_id);
 IF v->>'reason' IS NOT NULL OR (v-'emailPreference') IS DISTINCT FROM (e.content-'emailPreference') THEN RAISE EXCEPTION 'Alert no longer eligible'; END IF;
 IF NOT coalesce((v->>'emailPreference')::boolean,false) THEN RAISE EXCEPTION 'Email alerts disabled'; END IF;
 IF p_payload->>'label' IS DISTINCT FROM 'saved-drug-price-change' OR p_payload->>'purpose' IS DISTINCT FROM 'transactional' OR p_payload->>'idempotency_key' IS DISTINCT FROM 'saved-drug:'||e.id::text OR p_payload->>'message_id' IS DISTINCT FROM e.id::text OR p_payload->>'unsubscribe_token' IS NULL THEN RAISE EXCEPTION 'Invalid saved alert payload'; END IF;
 IF EXISTS(SELECT 1 FROM suppressed_emails WHERE lower(email)=lower(p_payload->>'to')) OR NOT EXISTS(SELECT 1 FROM email_unsubscribe_tokens WHERE token=p_payload->>'unsubscribe_token' AND lower(email)=lower(p_payload->>'to') AND used_at IS NULL) THEN RAISE EXCEPTION 'Recipient suppressed'; END IF;
 queue_id=public.enqueue_email('transactional_emails',p_payload);
 INSERT INTO email_send_log(message_id,template_name,recipient_email,status) VALUES(e.id::text,'saved-drug-price-change',p_payload->>'to','pending');
 UPDATE nadac_saved_drug_events SET queued_at=now() WHERE id=e.id;
 RETURN jsonb_build_object('queued',true,'duplicate',false);
END $$;
REVOKE ALL ON FUNCTION public.nadac_saved_alert_preview(uuid),public.nadac_prepare_saved_alert(uuid),public.nadac_enqueue_saved_alert(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_saved_alert_preview(uuid),public.nadac_prepare_saved_alert(uuid),public.nadac_enqueue_saved_alert(uuid,jsonb) TO service_role;
COMMENT ON TABLE public.nadac_alert_delivery_state IS 'Fail closed until activation. Runs started before activation cannot send catch-up emails.';
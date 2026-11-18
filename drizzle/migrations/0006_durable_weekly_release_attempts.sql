ALTER TABLE public.nadac_import_runs ADD COLUMN source_url text;
ALTER TABLE public.nadac_import_runs ADD COLUMN dataset_id text;
ALTER TABLE public.nadac_import_runs ADD COLUMN detected_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.nadac_import_runs ADD COLUMN download_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.nadac_import_runs ADD COLUMN validation_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.nadac_import_runs ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.nadac_import_runs ADD COLUMN last_attempt_at timestamptz;
ALTER TABLE public.nadac_import_runs ADD COLUMN deadline_at timestamptz;
ALTER TABLE public.nadac_import_runs ADD COLUMN failure_stage text;
ALTER TABLE public.nadac_import_runs ADD COLUMN published_at timestamptz;
ALTER TABLE public.nadac_import_runs ADD COLUMN active_stage text;
ALTER TABLE public.nadac_import_runs ADD COLUMN artifact_verified boolean NOT NULL DEFAULT false;
UPDATE public.nadac_import_runs SET download_status='completed',validation_status='completed',artifact_verified=true,published_at=CASE WHEN NOT baseline THEN completed_at END,last_attempt_at=started_at WHERE status='completed';
CREATE TABLE public.nadac_run_attempts (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 run_id uuid NOT NULL REFERENCES public.nadac_import_runs(id),
 stage text NOT NULL,
 outcome text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 record_count integer NOT NULL DEFAULT 0,
 retry_count integer NOT NULL DEFAULT 0,
 reason text
);
GRANT SELECT ON public.nadac_run_attempts TO authenticated;
GRANT SELECT,INSERT ON public.nadac_run_attempts TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.nadac_run_attempts_id_seq TO service_role;
ALTER TABLE public.nadac_run_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read pipeline attempts" ON public.nadac_run_attempts FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
COMMENT ON TABLE public.nadac_run_attempts IS 'Append-only private pipeline outcomes. Never contains source payloads, credentials or account email addresses.';
CREATE FUNCTION public.nadac_detect_release(p_source date,p_url text,p_dataset text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 IF p_source>current_date OR p_url NOT LIKE 'https://data.medicaid.gov/%' OR length(p_url)>2000 OR p_dataset IS DISTINCT FROM 'fbb83258-11c7-47f5-8b18-5f8e79f7e704' THEN RAISE EXCEPTION 'Invalid CMS source'; END IF;
 SELECT id INTO v FROM nadac_import_runs WHERE source_date=p_source ORDER BY artifact_verified DESC,started_at LIMIT 1;
 IF v IS NOT NULL THEN RETURN v; END IF;
 INSERT INTO nadac_import_runs(source_date,checksum,expected_count,source_url,dataset_id,status,active_stage)
 VALUES(p_source,repeat('0',64),1,p_url,p_dataset,'detected','download') RETURNING id INTO v;
 INSERT INTO nadac_run_attempts(run_id,stage,outcome) VALUES(v,'download','detected');
 RETURN v;
END $$;
CREATE FUNCTION public.nadac_start_stage(p_run uuid,p_stage text,p_retry boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs;
BEGIN
 IF p_stage NOT IN('download','search','validation','current_prices','drug_pages','movers','homepage','digest','freshness') THEN RAISE EXCEPTION 'Invalid stage'; END IF;
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' THEN RETURN; END IF;
 UPDATE nadac_import_runs SET active_stage=p_stage,status='processing',last_attempt_at=now(),deadline_at=now()+interval '2 hours',retry_count=retry_count+CASE WHEN p_retry THEN 1 ELSE 0 END,failure_reason=NULL,failure_stage=NULL WHERE id=p_run;
 INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count,retry_count) SELECT id,p_stage,'started',record_count,retry_count FROM nadac_import_runs WHERE id=p_run;
END $$;
CREATE OR REPLACE FUNCTION public.nadac_begin_run(p_source date,p_checksum text,p_expected integer,p_previous uuid DEFAULT NULL,p_historical boolean DEFAULT true,p_baseline boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v uuid; r nadac_import_runs;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 IF p_checksum !~ '^[a-f0-9]{64}$' OR p_checksum=repeat('0',64) OR p_expected<=0 THEN RAISE EXCEPTION 'Invalid artifact'; END IF;
 IF p_previous IS NOT NULL AND NOT EXISTS(SELECT 1 FROM nadac_import_runs WHERE id=p_previous AND source_date=p_source-7) THEN RAISE EXCEPTION 'Immediately preceding weekly release is required'; END IF;
 SELECT * INTO r FROM nadac_import_runs WHERE source_date=p_source ORDER BY artifact_verified DESC,started_at LIMIT 1 FOR UPDATE;
 IF FOUND THEN
  IF r.artifact_verified AND (r.checksum<>p_checksum OR r.expected_count<>p_expected OR r.historical<>p_historical OR r.baseline<>p_baseline OR (p_previous IS NOT NULL AND r.previous_run_id IS NOT NULL AND r.previous_run_id<>p_previous)) THEN RAISE EXCEPTION 'Retry metadata differs; explicit correction review required'; END IF;
  v=r.id;
  IF r.status='completed' THEN RETURN v; END IF;
  UPDATE nadac_import_runs SET checksum=p_checksum,expected_count=p_expected,previous_run_id=coalesce(previous_run_id,p_previous),historical=p_historical,baseline=p_baseline,artifact_verified=true,download_status='completed',status='processing' WHERE id=v;
 ELSE
  INSERT INTO nadac_import_runs(source_date,checksum,expected_count,previous_run_id,historical,baseline,artifact_verified,download_status)
  VALUES(p_source,p_checksum,p_expected,p_previous,p_historical,p_baseline,true,'completed') RETURNING id INTO v;
 END IF;
 INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count) VALUES(v,'download','completed',p_expected);
 RETURN v;
END $$;
CREATE OR REPLACE FUNCTION public.nadac_validate_run(p_run uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; n integer; d date;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' THEN RETURN; END IF;
 SELECT count(*),max(effective_date) INTO n,d FROM nadac_release_records WHERE run_id=p_run;
 IF NOT r.artifact_verified OR r.download_status<>'completed' OR n<>r.expected_count OR r.rejected_count<>0 OR EXISTS(SELECT 1 FROM nadac_release_records WHERE run_id=p_run AND (ndc !~ '^[0-9]{11}$' OR drug_name='' OR pricing_unit='' OR pharmacy_type='' OR nadac_per_unit<0)) THEN RAISE EXCEPTION 'Incomplete or invalid release'; END IF;
 UPDATE nadac_import_runs SET record_count=n,source_effective_date=d,search_status='completed',validation_status='completed',current_price_status='completed',drug_page_status='completed',ingested_at=coalesce(ingested_at,now()),status='processing',failure_reason=NULL,failure_stage=NULL,active_stage=NULL,deadline_at=NULL WHERE id=p_run;
 INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count,retry_count) SELECT id,'validation','completed',n,retry_count FROM nadac_import_runs WHERE id=p_run;
END $$;
CREATE OR REPLACE FUNCTION public.nadac_fail_run(p_run uuid,p_stage text,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE safe text;
BEGIN
 IF p_stage NOT IN('download','search','validation','current_prices','drug_pages','movers','homepage','digest','freshness') THEN RAISE EXCEPTION 'Invalid stage'; END IF;
 safe=CASE WHEN p_reason='Processing exceeded two-hour deadline' THEN p_reason WHEN p_stage='movers' AND p_reason='Immediately preceding completed release required' THEN 'Immediately preceding completed release required; comparison unavailable' ELSE 'Stage failed; retry this stage after checking the CMS artifact and prerequisite stages' END;
 UPDATE nadac_import_runs SET status='failed',failure_stage=p_stage,failure_reason=safe,active_stage=NULL,deadline_at=NULL,
 download_status=CASE WHEN p_stage='download' THEN 'failed' ELSE download_status END,
 validation_status=CASE WHEN p_stage IN('validation','search') THEN 'failed' ELSE validation_status END,
 search_status=CASE WHEN p_stage='search' THEN 'failed' ELSE search_status END,
 current_price_status=CASE WHEN p_stage IN('search','current_prices') THEN 'failed' ELSE current_price_status END,
 drug_page_status=CASE WHEN p_stage IN('search','drug_pages') THEN 'failed' ELSE drug_page_status END,
 movers_status=CASE WHEN p_stage='movers' THEN 'failed' ELSE movers_status END,
 homepage_status=CASE WHEN p_stage='homepage' THEN 'failed' ELSE homepage_status END,
 digest_status=CASE WHEN p_stage='digest' THEN 'failed' ELSE digest_status END,
 freshness_status=CASE WHEN p_stage='freshness' THEN 'failed' ELSE freshness_status END WHERE id=p_run AND status<>'completed';
 IF FOUND THEN INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count,retry_count,reason) SELECT id,p_stage,'failed',record_count,retry_count,safe FROM nadac_import_runs WHERE id=p_run; END IF;
END $$;
CREATE FUNCTION public.nadac_expire_runs() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; n integer=0;
BEGIN
 FOR r IN SELECT id,coalesce(active_stage,'download') stage FROM nadac_import_runs WHERE status='processing' AND deadline_at<=now() FOR UPDATE LOOP
  PERFORM nadac_fail_run(r.id,r.stage,'Processing exceeded two-hour deadline'); n=n+1;
 END LOOP;
 RETURN n;
END $$;
CREATE FUNCTION public.nadac_pipeline_status() RETURNS SETOF public.nadac_import_runs LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT r.id,r.source_date,r.checksum,r.previous_run_id,r.source_effective_date,r.started_at,r.ingested_at,r.completed_at,r.expected_count,r.record_count,r.search_status,r.movers_status,r.homepage_status,r.digest_status,r.freshness_status,
 CASE WHEN r.status='processing' AND r.deadline_at<=now() THEN 'failed' ELSE r.status END,
 CASE WHEN r.status='processing' AND r.deadline_at<=now() THEN 'Processing exceeded two-hour deadline' ELSE r.failure_reason END,
 r.historical,r.baseline,r.total_changed,r.added_count,r.removed_count,r.non_comparable_count,r.unchanged_count,r.top_increases,r.top_decreases,r.current_price_status,r.drug_page_status,r.rejected_count,r.source_url,r.dataset_id,r.detected_at,r.download_status,r.validation_status,r.retry_count,r.last_attempt_at,r.deadline_at,
 CASE WHEN r.status='processing' AND r.deadline_at<=now() THEN coalesce(r.active_stage,'download') ELSE r.failure_stage END,r.published_at,r.active_stage,r.artifact_verified
 FROM nadac_import_runs r ORDER BY source_date DESC LIMIT 30
$$;
CREATE FUNCTION public.nadac_protect_published_movers() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM nadac_import_runs WHERE id=OLD.run_id AND status='completed') THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Finalized release Movers are immutable'; END IF;
  IF ROW(NEW.run_id,NEW.effective_date,NEW.previous_date,NEW.total_changed,NEW.top_increases,NEW.top_decreases) IS DISTINCT FROM ROW(OLD.run_id,OLD.effective_date,OLD.previous_date,OLD.total_changed,OLD.top_increases,OLD.top_decreases) THEN RAISE EXCEPTION 'Finalized release Movers are immutable'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_finalized_movers BEFORE UPDATE OR DELETE ON public.weekly_movers FOR EACH ROW EXECUTE FUNCTION public.nadac_protect_published_movers();
CREATE FUNCTION public.nadac_log_run_completion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='completed' AND OLD.status<>'completed' THEN
  IF NEW.validation_status<>'completed' OR NEW.download_status<>'completed' OR NOT NEW.artifact_verified THEN RAISE EXCEPTION 'Download and validation required'; END IF;
  NEW.published_at=CASE WHEN NOT NEW.baseline THEN NEW.completed_at END; NEW.deadline_at=NULL; NEW.active_stage=NULL;
  INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count,retry_count) VALUES(NEW.id,'freshness','completed',NEW.record_count,NEW.retry_count);
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER log_finalized_run BEFORE UPDATE ON public.nadac_import_runs FOR EACH ROW EXECUTE FUNCTION public.nadac_log_run_completion();
CREATE OR REPLACE FUNCTION public.nadac_public_invariant() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; n bigint; d date; m weekly_movers; ok boolean;
BEGIN
 SELECT c.* INTO r FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE b.id=1;
 SELECT count(*),max(effective_date) INTO n,d FROM nadac_published_drugs;
 SELECT * INTO m FROM weekly_movers WHERE run_id=r.id;
 ok=coalesce(r.status='completed' AND n=r.expected_count AND r.rejected_count=0 AND m.effective_date=r.source_date AND m.previous_date=(SELECT source_date FROM nadac_import_runs WHERE id=r.previous_run_id) AND m.total_changed=r.total_changed AND m.top_increases=r.top_increases AND m.top_decreases=r.top_decreases,false);
 RETURN jsonb_build_object('ok',ok,'error',CASE WHEN NOT ok THEN 'Published comparison requires verification' END,'runId',r.id,'searchPublicationDate',CASE WHEN n>0 THEN r.source_date END,'drugPagePublicationDate',CASE WHEN n>0 THEN r.source_date END,'homepagePublicationDate',r.source_date,'moversPublicationDate',m.effective_date,'publishedCount',n,'expectedCount',r.expected_count,'maxSearchableEffectiveDate',d,'effectiveDateMismatch',false,'effectiveDateError',NULL);
END $$;
CREATE OR REPLACE FUNCTION public.nadac_public_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; p date; failed boolean; overdue boolean; n bigint; inv jsonb;
BEGIN
 SELECT c.* INTO r FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE b.id=1 AND c.status='completed';
 SELECT max(source_date),coalesce(bool_or(status='failed'),false),coalesce(bool_or(status='processing' AND deadline_at<=now()),false) INTO p,failed,overdue FROM nadac_import_runs WHERE NOT baseline AND status<>'completed' AND source_date>coalesce(r.source_date,'1900-01-01'::date);
 -- A missed Wednesday is a delayed publication, never proof of a detected or processing release.
 failed=failed OR (r.source_date IS NOT NULL AND r.source_date+7<current_date AND p IS NULL);
 SELECT count(*) INTO n FROM nadac_published_drugs; inv=nadac_public_invariant();
 RETURN jsonb_build_object('runId',r.id,'currentDate',r.source_date,'previousDate',(SELECT source_date FROM nadac_import_runs WHERE id=r.previous_run_id),'completedAt',r.completed_at,'pendingDate',p,'publicationDelayed',failed OR overdue OR NOT coalesce((inv->>'ok')::boolean,false),'totalRecords',n,
 'topIncreases',CASE WHEN p IS NULL AND NOT failed AND NOT overdue AND (inv->>'ok')::boolean THEN r.top_increases ELSE '[]'::jsonb END,'topDecreases',CASE WHEN p IS NULL AND NOT failed AND NOT overdue AND (inv->>'ok')::boolean THEN r.top_decreases ELSE '[]'::jsonb END,'totalChanged',r.total_changed,'added',r.added_count,'removed',r.removed_count,'nonComparable',r.non_comparable_count,'rejected',r.rejected_count,'currentPriceStatus',r.current_price_status,'drugPageStatus',r.drug_page_status,'invariant',inv);
END $$;
REVOKE ALL ON FUNCTION public.nadac_detect_release(date,text,text),public.nadac_start_stage(uuid,text,boolean),public.nadac_expire_runs(),public.nadac_pipeline_status() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_detect_release(date,text,text),public.nadac_start_stage(uuid,text,boolean),public.nadac_expire_runs(),public.nadac_pipeline_status() TO service_role;
REVOKE ALL ON FUNCTION public.nadac_protect_published_movers(),public.nadac_log_run_completion() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_protect_published_movers(),public.nadac_log_run_completion() TO service_role;
REVOKE ALL ON FUNCTION public.nadac_begin_run(date,text,integer,uuid,boolean,boolean),public.nadac_validate_run(uuid),public.nadac_fail_run(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_begin_run(date,text,integer,uuid,boolean,boolean),public.nadac_validate_run(uuid),public.nadac_fail_run(uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.nadac_public_status(),public.nadac_public_invariant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nadac_public_status(),public.nadac_public_invariant() TO anon,authenticated,service_role;
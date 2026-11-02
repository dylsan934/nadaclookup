ALTER TABLE public.nadac_import_runs ADD COLUMN current_price_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.nadac_import_runs ADD COLUMN drug_page_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.nadac_import_runs ADD COLUMN rejected_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.nadac_validate_run(p_run uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; n integer; d date;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 SELECT count(*),max(effective_date) INTO n,d FROM nadac_release_records WHERE run_id=p_run;
 IF n<>r.expected_count OR r.rejected_count<>0 OR EXISTS(
  SELECT 1 FROM nadac_release_records WHERE run_id=p_run AND (ndc !~ '^[0-9]{11}$' OR drug_name='' OR pricing_unit='' OR pharmacy_type='' OR nadac_per_unit<0)
 ) THEN RAISE EXCEPTION 'Incomplete or invalid release'; END IF;
 UPDATE nadac_import_runs SET record_count=n,source_effective_date=d,search_status='completed',current_price_status='completed',drug_page_status='completed',
 ingested_at=coalesce(ingested_at,now()),status=CASE WHEN status='completed' THEN status ELSE 'processing' END,failure_reason=NULL WHERE id=p_run;
END $$;

CREATE VIEW public.nadac_published_drugs WITH (security_barrier=true) AS
 SELECT md5(c.run_id::text||':'||c.ndc)::uuid AS id,c.ndc,c.drug_name,c.nadac_per_unit,c.effective_date,c.pricing_unit,c.pharmacy_type,c.explanation,
 r.started_at AS created_at,r.completed_at AS updated_at,c.run_id,r.source_date AS publication_date
 FROM public.nadac_release_records c JOIN public.nadac_import_runs r ON r.id=c.run_id
 JOIN public.nadac_publication b ON b.id=1 AND b.current_run_id=r.id
 WHERE r.status='completed' AND r.search_status='completed' AND r.current_price_status='completed' AND r.drug_page_status='completed'
 AND r.movers_status='completed' AND r.homepage_status='completed' AND r.digest_status='completed' AND r.freshness_status='completed'
 AND r.failure_reason IS NULL AND r.record_count=r.expected_count AND r.rejected_count=0;
GRANT SELECT ON public.nadac_published_drugs TO anon,authenticated,service_role;
COMMENT ON VIEW public.nadac_published_drugs IS 'Public prices only from one fully finalized immutable CMS release; underlying staging and account data remain private.';

CREATE OR REPLACE FUNCTION public.nadac_finalize_run(p_run uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; prev_date date; n integer;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' THEN RETURN; END IF;
 SELECT count(*) INTO n FROM nadac_release_records WHERE run_id=p_run;
 IF r.search_status<>'completed' OR r.current_price_status<>'completed' OR r.drug_page_status<>'completed' OR r.movers_status<>'completed'
 OR r.homepage_status<>'completed' OR r.digest_status<>'completed' OR r.record_count<>r.expected_count OR n<>r.expected_count OR r.rejected_count<>0 OR r.failure_reason IS NOT NULL
 THEN RAISE EXCEPTION 'All stages must succeed before publication'; END IF;
 IF r.baseline THEN UPDATE nadac_import_runs SET freshness_status='completed',status='completed',completed_at=now() WHERE id=p_run; RETURN; END IF;
 SELECT source_date INTO prev_date FROM nadac_import_runs WHERE id=r.previous_run_id AND status='completed' AND record_count=expected_count AND search_status='completed';
 IF prev_date IS NULL OR prev_date<>r.source_date-7 THEN RAISE EXCEPTION 'Immediately preceding completed release required'; END IF;
 IF EXISTS(SELECT 1 FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE c.source_date>=r.source_date AND c.id<>p_run) THEN RAISE EXCEPTION 'Cannot publish an older release'; END IF;
 -- Keep searchable history unchanged during historical repair. Live scheduling is not cut over here.
 IF NOT r.historical THEN
 INSERT INTO nadac_drugs(ndc,drug_name,nadac_per_unit,effective_date,pricing_unit,pharmacy_type,explanation)
 SELECT ndc,drug_name,nadac_per_unit,effective_date,pricing_unit,pharmacy_type,explanation FROM nadac_release_records WHERE run_id=p_run
 ON CONFLICT(ndc,effective_date) DO UPDATE SET drug_name=EXCLUDED.drug_name,nadac_per_unit=EXCLUDED.nadac_per_unit,pricing_unit=EXCLUDED.pricing_unit,pharmacy_type=EXCLUDED.pharmacy_type,explanation=EXCLUDED.explanation;
 END IF;
 SELECT source_date INTO prev_date FROM nadac_import_runs WHERE id=r.previous_run_id;
 INSERT INTO weekly_movers(effective_date,previous_date,top_increases,top_decreases,total_changed,run_id)
 VALUES(r.source_date,prev_date,r.top_increases,r.top_decreases,r.total_changed,p_run)
 ON CONFLICT(effective_date) DO UPDATE SET previous_date=EXCLUDED.previous_date,top_increases=EXCLUDED.top_increases,top_decreases=EXCLUDED.top_decreases,total_changed=EXCLUDED.total_changed,run_id=EXCLUDED.run_id,created_at=now();
 UPDATE nadac_import_runs SET status='completed',freshness_status='completed',completed_at=now(),failure_reason=NULL WHERE id=p_run;
 INSERT INTO nadac_publication(id,current_run_id) VALUES(1,p_run) ON CONFLICT(id) DO UPDATE SET current_run_id=p_run;
 SELECT count(*) INTO n FROM nadac_published_drugs WHERE run_id=p_run AND publication_date=r.source_date;
 IF n<>r.expected_count OR NOT EXISTS(SELECT 1 FROM weekly_movers WHERE run_id=p_run AND effective_date=r.source_date AND previous_date=prev_date AND total_changed=r.total_changed)
 THEN RAISE EXCEPTION 'Public surface release invariant failed'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.nadac_fail_run(p_run uuid,p_stage text,p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_stage NOT IN('search','current_prices','drug_pages','movers','homepage','digest','freshness') THEN RAISE EXCEPTION 'Invalid stage'; END IF;
 UPDATE nadac_import_runs SET status='failed',failure_reason=left(p_stage||': '||p_reason,2000),
 search_status=CASE WHEN p_stage='search' THEN 'failed' ELSE search_status END,
 current_price_status=CASE WHEN p_stage IN('search','current_prices') THEN 'failed' ELSE current_price_status END,
 drug_page_status=CASE WHEN p_stage IN('search','drug_pages') THEN 'failed' ELSE drug_page_status END,
 movers_status=CASE WHEN p_stage='movers' THEN 'failed' ELSE movers_status END,
 homepage_status=CASE WHEN p_stage='homepage' THEN 'failed' ELSE homepage_status END,
 digest_status=CASE WHEN p_stage='digest' THEN 'failed' ELSE digest_status END,
 freshness_status=CASE WHEN p_stage='freshness' THEN 'failed' ELSE freshness_status END WHERE id=p_run AND status<>'completed';
END $$;

CREATE FUNCTION public.nadac_public_invariant() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; n bigint; d date; raw_date date; mover_date date; ok boolean;
BEGIN
 SELECT c.* INTO r FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE b.id=1;
 SELECT count(*),max(effective_date) INTO n,d FROM nadac_published_drugs;
 SELECT max(effective_date) INTO raw_date FROM nadac_drugs;
 SELECT effective_date INTO mover_date FROM weekly_movers WHERE run_id=r.id;
 ok=coalesce(r.status='completed' AND n=r.expected_count AND r.rejected_count=0 AND mover_date=r.source_date,true) AND r.id IS NOT NULL;
 RETURN jsonb_build_object('ok',ok,'error',CASE WHEN ok THEN NULL ELSE 'Public surface release invariant failed' END,
 'runId',r.id,'searchPublicationDate',CASE WHEN n>0 THEN r.source_date END,'drugPagePublicationDate',CASE WHEN n>0 THEN r.source_date END,
 'homepagePublicationDate',r.source_date,'moversPublicationDate',mover_date,'publishedCount',n,'expectedCount',r.expected_count,
 'maxSearchableEffectiveDate',d,'rawHistoryMaxEffectiveDate',raw_date,
 'effectiveDateMismatch',d IS DISTINCT FROM r.source_date OR raw_date IS DISTINCT FROM r.source_date,
 'effectiveDateError',CASE WHEN d IS DISTINCT FROM r.source_date OR raw_date IS DISTINCT FROM r.source_date THEN 'Effective dates differ from publication date; inspect source dates without rewriting prices' END);
END $$;
REVOKE ALL ON FUNCTION public.nadac_public_invariant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nadac_public_invariant() TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.nadac_public_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; pending_date date; raw_date date; n bigint;
BEGIN
 SELECT c.* INTO r FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE b.id=1 AND c.status='completed';
 SELECT max(source_date) INTO pending_date FROM nadac_import_runs WHERE NOT baseline AND status<>'completed' AND (r.source_date IS NULL OR source_date>r.source_date);
 SELECT max(effective_date) INTO raw_date FROM nadac_drugs;
 -- Legacy writes have no release identity. Report newer unmatched dates as unfinalized activity, not publication proof.
 IF raw_date>greatest(coalesce(r.source_date,'1900-01-01'::date),coalesce(r.source_effective_date,'1900-01-01'::date)) THEN pending_date=greatest(pending_date,raw_date); END IF;
 SELECT count(*) INTO n FROM nadac_published_drugs;
 RETURN jsonb_build_object('runId',r.id,'currentDate',r.source_date,'previousDate',(SELECT source_date FROM nadac_import_runs WHERE id=r.previous_run_id),'completedAt',r.completed_at,
 'pendingDate',pending_date,'totalRecords',n,'topIncreases',CASE WHEN pending_date IS NULL AND n=r.expected_count THEN coalesce(r.top_increases,'[]') ELSE '[]'::jsonb END,
 'topDecreases',CASE WHEN pending_date IS NULL AND n=r.expected_count THEN coalesce(r.top_decreases,'[]') ELSE '[]'::jsonb END,'totalChanged',r.total_changed,
 'added',r.added_count,'removed',r.removed_count,'nonComparable',r.non_comparable_count,'rejected',r.rejected_count,
 'currentPriceStatus',r.current_price_status,'drugPageStatus',r.drug_page_status,'invariant',nadac_public_invariant());
END $$;
REVOKE ALL ON FUNCTION public.nadac_validate_run(uuid),public.nadac_finalize_run(uuid),public.nadac_fail_run(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_validate_run(uuid),public.nadac_finalize_run(uuid),public.nadac_fail_run(uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.nadac_public_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nadac_public_status() TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.nadac_validate_run(p_run uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r nadac_import_runs; n integer; d date;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.search_status='completed' THEN RETURN; END IF;
 SELECT count(*),max(effective_date) INTO n,d FROM nadac_release_records WHERE run_id=p_run;
 IF n<>r.expected_count THEN RAISE EXCEPTION 'Incomplete or invalid release'; END IF;
 UPDATE nadac_import_runs SET record_count=n,source_effective_date=d,search_status='completed',ingested_at=now(),status='processing',failure_reason=NULL WHERE id=p_run;
END $$;
COMMENT ON COLUMN public.nadac_import_runs.source_effective_date IS 'Maximum per-record effective date; CMS can publish future-effective records. Not the weekly source publication date.';
REVOKE ALL ON FUNCTION public.nadac_validate_run(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_validate_run(uuid) TO service_role;
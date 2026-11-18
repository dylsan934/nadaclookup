CREATE FUNCTION public.nadac_complete_stage(p_run uuid,p_stage text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' THEN RETURN; END IF;
 IF (p_stage='movers' AND r.movers_status='completed') OR (p_stage='digest' AND r.digest_status='completed') THEN
  UPDATE nadac_import_runs SET active_stage=NULL,deadline_at=NULL,failure_stage=NULL,failure_reason=NULL WHERE id=p_run;
  INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count,retry_count) VALUES(p_run,p_stage,'completed',r.record_count,r.retry_count);
 ELSE RAISE EXCEPTION 'Stage not completed'; END IF;
END $$;
CREATE FUNCTION public.nadac_link_previous(p_run uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; p uuid;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' OR r.baseline OR r.movers_status='completed' THEN RETURN; END IF;
 SELECT id INTO p FROM nadac_import_runs WHERE source_date=r.source_date-7 AND status='completed' AND validation_status='completed' ORDER BY started_at LIMIT 1;
 IF p IS NULL THEN RAISE EXCEPTION 'Immediately preceding completed release required'; END IF;
 UPDATE nadac_import_runs SET previous_run_id=p WHERE id=p_run;
END $$;
REVOKE ALL ON FUNCTION public.nadac_complete_stage(uuid,text),public.nadac_link_previous(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_complete_stage(uuid,text),public.nadac_link_previous(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.nadac_complete_stage(p_run uuid,p_stage text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' THEN RETURN; END IF;
 IF (p_stage='movers' AND r.movers_status='completed') OR (p_stage='digest' AND r.digest_status='completed') THEN
 UPDATE nadac_import_runs SET status=CASE WHEN p_stage='digest' THEN 'awaiting_review' ELSE 'validated' END,active_stage=NULL,deadline_at=NULL,failure_stage=NULL,failure_reason=NULL WHERE id=p_run;
 INSERT INTO nadac_run_attempts(run_id,stage,outcome,record_count,retry_count) VALUES(p_run,p_stage,'completed',r.record_count,r.retry_count);
 ELSE RAISE EXCEPTION 'Stage not completed'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.nadac_complete_stage(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_complete_stage(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.nadac_public_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; pending_date date; latest date; n bigint;
BEGIN
 SELECT c.* INTO r FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE b.id=1 AND c.status='completed';
 SELECT max(source_date) INTO pending_date FROM nadac_import_runs WHERE NOT baseline AND status<>'completed' AND (r.source_date IS NULL OR source_date>r.source_date);
 -- Legacy data is only a compatibility signal before the first finalized publication.
 -- Once a publication exists, row effective dates cannot stand in for CMS publication identity.
 IF r.id IS NULL THEN
  SELECT max(effective_date) INTO latest FROM nadac_drugs;
  pending_date=greatest(pending_date,latest);
 END IF;
 SELECT public.nadac_ndc_count() INTO n;
 RETURN jsonb_build_object('runId',r.id,'currentDate',r.source_date,'previousDate',(SELECT source_date FROM nadac_import_runs WHERE id=r.previous_run_id),'completedAt',r.completed_at,
 'pendingDate',pending_date,'totalRecords',n,'topIncreases',CASE WHEN pending_date IS NULL THEN coalesce(r.top_increases,'[]') ELSE '[]'::jsonb END,
 'topDecreases',CASE WHEN pending_date IS NULL THEN coalesce(r.top_decreases,'[]') ELSE '[]'::jsonb END,'totalChanged',r.total_changed,
 'added',r.added_count,'removed',r.removed_count,'nonComparable',r.non_comparable_count);
END $$;
REVOKE ALL ON FUNCTION public.nadac_public_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nadac_public_status() TO anon,authenticated,service_role;
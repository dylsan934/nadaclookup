CREATE TABLE public.nadac_import_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_date date NOT NULL, checksum text NOT NULL,
 previous_run_id uuid REFERENCES public.nadac_import_runs(id), source_effective_date date,
 started_at timestamptz NOT NULL DEFAULT now(), ingested_at timestamptz, completed_at timestamptz,
 expected_count integer NOT NULL, record_count integer NOT NULL DEFAULT 0,
 search_status text NOT NULL DEFAULT 'pending', movers_status text NOT NULL DEFAULT 'pending',
 homepage_status text NOT NULL DEFAULT 'pending', digest_status text NOT NULL DEFAULT 'pending',
 freshness_status text NOT NULL DEFAULT 'pending', status text NOT NULL DEFAULT 'processing',
 failure_reason text, historical boolean NOT NULL DEFAULT true, baseline boolean NOT NULL DEFAULT false,
 total_changed integer NOT NULL DEFAULT 0, added_count integer NOT NULL DEFAULT 0,
 removed_count integer NOT NULL DEFAULT 0, non_comparable_count integer NOT NULL DEFAULT 0,
 unchanged_count integer NOT NULL DEFAULT 0, top_increases jsonb NOT NULL DEFAULT '[]', top_decreases jsonb NOT NULL DEFAULT '[]',
 UNIQUE(source_date, checksum), CHECK(expected_count > 0), CHECK(checksum ~ '^[a-f0-9]{64}$')
);
GRANT SELECT ON public.nadac_import_runs TO authenticated;
GRANT ALL ON public.nadac_import_runs TO service_role;
ALTER TABLE public.nadac_import_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read weekly runs" ON public.nadac_import_runs FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.nadac_release_records (
 run_id uuid NOT NULL REFERENCES public.nadac_import_runs(id), ndc text NOT NULL,
 drug_name text NOT NULL, nadac_per_unit numeric NOT NULL, effective_date date NOT NULL,
 pricing_unit text NOT NULL, pharmacy_type text NOT NULL, explanation text,
 PRIMARY KEY(run_id,ndc), CHECK(ndc ~ '^[0-9]{11}$'), CHECK(nadac_per_unit >= 0)
);
GRANT SELECT ON public.nadac_release_records TO authenticated;
GRANT ALL ON public.nadac_release_records TO service_role;
ALTER TABLE public.nadac_release_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read release records" ON public.nadac_release_records FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.nadac_publication (
 id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), current_run_id uuid REFERENCES public.nadac_import_runs(id)
);
GRANT ALL ON public.nadac_publication TO service_role;
ALTER TABLE public.nadac_publication ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.weekly_digest_preparations (
 run_id uuid NOT NULL REFERENCES public.nadac_import_runs(id), user_id uuid NOT NULL,
 kind text NOT NULL DEFAULT 'weekly_movers', content_identity text NOT NULL,
 eligibility text NOT NULL, preview_only boolean NOT NULL DEFAULT true CHECK(preview_only),
 prepared_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(run_id,user_id,kind)
);
GRANT SELECT ON public.weekly_digest_preparations TO authenticated;
GRANT ALL ON public.weekly_digest_preparations TO service_role;
ALTER TABLE public.weekly_digest_preparations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read digest previews" ON public.weekly_digest_preparations FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
ALTER TABLE public.weekly_movers ADD COLUMN IF NOT EXISTS run_id uuid REFERENCES public.nadac_import_runs(id);
CREATE UNIQUE INDEX IF NOT EXISTS weekly_movers_run_unique ON public.weekly_movers(run_id) WHERE run_id IS NOT NULL;

CREATE FUNCTION public.nadac_begin_run(p_source date,p_checksum text,p_expected integer,p_previous uuid DEFAULT NULL,p_historical boolean DEFAULT true,p_baseline boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 IF p_previous IS NOT NULL AND NOT EXISTS(SELECT 1 FROM nadac_import_runs WHERE id=p_previous AND status='completed' AND source_date<p_source) THEN RAISE EXCEPTION 'Previous release is not completed'; END IF;
 IF NOT p_baseline AND (p_previous IS NULL OR (SELECT source_date FROM nadac_import_runs WHERE id=p_previous)<>p_source-7) THEN RAISE EXCEPTION 'Immediately preceding weekly release is required'; END IF;
 IF EXISTS(SELECT 1 FROM nadac_import_runs WHERE source_date=p_source AND checksum<>p_checksum) THEN RAISE EXCEPTION 'Source checksum differs; explicit correction review required'; END IF;
 INSERT INTO nadac_import_runs(source_date,checksum,expected_count,previous_run_id,historical,baseline)
 VALUES(p_source,p_checksum,p_expected,p_previous,p_historical,p_baseline) ON CONFLICT(source_date,checksum) DO NOTHING;
 SELECT id INTO v_id FROM nadac_import_runs WHERE source_date=p_source AND checksum=p_checksum;
 IF EXISTS(SELECT 1 FROM nadac_import_runs WHERE id=v_id AND (expected_count<>p_expected OR previous_run_id IS DISTINCT FROM p_previous OR historical<>p_historical OR baseline<>p_baseline)) THEN RAISE EXCEPTION 'Retry metadata differs'; END IF;
 RETURN v_id;
END $$;
CREATE FUNCTION public.nadac_stage_records(p_run uuid,p_records jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r nadac_import_runs; n integer;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.search_status='completed' THEN RETURN r.record_count; END IF;
 IF jsonb_typeof(p_records)<>'array' OR jsonb_array_length(p_records)>1000 THEN RAISE EXCEPTION 'Invalid staging batch'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_records) AS x(ndc text,drug_name text,nadac_per_unit numeric,effective_date date,pricing_unit text,pharmacy_type text,explanation text) JOIN nadac_release_records e ON e.run_id=p_run AND e.ndc=x.ndc WHERE ROW(e.drug_name,e.nadac_per_unit,e.effective_date,e.pricing_unit,e.pharmacy_type,e.explanation) IS DISTINCT FROM ROW(x.drug_name,x.nadac_per_unit,x.effective_date,x.pricing_unit,x.pharmacy_type,x.explanation)) THEN RAISE EXCEPTION 'Ambiguous duplicate NDC'; END IF;
 INSERT INTO nadac_release_records SELECT p_run,x.* FROM jsonb_to_recordset(p_records) AS x(ndc text,drug_name text,nadac_per_unit numeric,effective_date date,pricing_unit text,pharmacy_type text,explanation text) ON CONFLICT(run_id,ndc) DO NOTHING;
 SELECT count(*) INTO n FROM nadac_release_records WHERE run_id=p_run;
 UPDATE nadac_import_runs SET record_count=n WHERE id=p_run;
 RETURN n;
END $$;
CREATE FUNCTION public.nadac_validate_run(p_run uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r nadac_import_runs; n integer; d date;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.search_status='completed' THEN RETURN; END IF;
 SELECT count(*),max(effective_date) INTO n,d FROM nadac_release_records WHERE run_id=p_run;
 IF n<>r.expected_count OR d>r.source_date THEN RAISE EXCEPTION 'Incomplete or invalid release'; END IF;
 UPDATE nadac_import_runs SET record_count=n,source_effective_date=d,search_status='completed',ingested_at=now(),status='processing',failure_reason=NULL WHERE id=p_run;
END $$;
CREATE FUNCTION public.nadac_compare_run(p_run uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r nadac_import_runs; prev nadac_import_runs; inc jsonb; dec jsonb;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND OR r.search_status<>'completed' THEN RAISE EXCEPTION 'Release not validated'; END IF;
 IF r.movers_status='completed' THEN RETURN; END IF;
 IF r.baseline THEN
 UPDATE nadac_import_runs SET movers_status='completed',homepage_status='completed' WHERE id=p_run; RETURN;
 END IF;
 SELECT * INTO prev FROM nadac_import_runs WHERE id=r.previous_run_id;
 IF prev.status<>'completed' OR prev.source_date<>r.source_date-7 THEN RAISE EXCEPTION 'Immediately preceding completed release required'; END IF;
 WITH pairs AS (
 SELECT c.ndc AS c_ndc,p.ndc AS p_ndc,c.nadac_per_unit AS new_price,p.nadac_per_unit AS old_price,
 (c.drug_name=p.drug_name AND c.pricing_unit=p.pricing_unit AND c.pharmacy_type=p.pharmacy_type AND p.nadac_per_unit>0) AS comparable
 FROM (SELECT * FROM nadac_release_records WHERE run_id=p_run) c FULL JOIN (SELECT * FROM nadac_release_records WHERE run_id=r.previous_run_id) p ON p.ndc=c.ndc
 ) UPDATE nadac_import_runs SET
 added_count=(SELECT count(*) FROM pairs WHERE p_ndc IS NULL), removed_count=(SELECT count(*) FROM pairs WHERE c_ndc IS NULL),
 non_comparable_count=(SELECT count(*) FROM pairs WHERE c_ndc IS NOT NULL AND p_ndc IS NOT NULL AND NOT comparable),
 unchanged_count=(SELECT count(*) FROM pairs WHERE comparable AND new_price=old_price), total_changed=(SELECT count(*) FROM pairs WHERE comparable AND new_price<>old_price)
 WHERE id=p_run;
 WITH changed AS (
 SELECT DISTINCT ON(c.drug_name) c.ndc,c.drug_name,c.pricing_unit,p.nadac_per_unit old_price,c.nadac_per_unit new_price,
 round((c.nadac_per_unit-p.nadac_per_unit)/p.nadac_per_unit*100,2) pct
 FROM nadac_release_records c JOIN nadac_release_records p ON p.run_id=r.previous_run_id AND c.ndc=p.ndc
 WHERE c.run_id=p_run AND c.drug_name=p.drug_name AND c.pricing_unit=p.pricing_unit AND c.pharmacy_type=p.pharmacy_type AND p.nadac_per_unit>0 AND c.nadac_per_unit<>p.nadac_per_unit
 ORDER BY c.drug_name,abs((c.nadac_per_unit-p.nadac_per_unit)/p.nadac_per_unit) DESC,c.ndc
 ), ranked AS (SELECT jsonb_build_object('ndc',ndc,'drugName',drug_name,'oldPrice',old_price,'newPrice',new_price,'pctChange',pct,'pricingUnit',pricing_unit) obj,pct FROM changed)
 SELECT coalesce((SELECT jsonb_agg(obj ORDER BY pct DESC) FROM (SELECT * FROM ranked WHERE pct>0 ORDER BY pct DESC LIMIT 10) x),'[]'),
 coalesce((SELECT jsonb_agg(obj ORDER BY pct) FROM (SELECT * FROM ranked WHERE pct<0 ORDER BY pct LIMIT 10) x),'[]') INTO inc,dec;
 UPDATE nadac_import_runs SET top_increases=inc,top_decreases=dec,movers_status='completed',homepage_status='completed',status='processing',failure_reason=NULL WHERE id=p_run;
END $$;
CREATE FUNCTION public.nadac_prepare_digest(p_run uuid,p_recipients jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r nadac_import_runs; n integer;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND OR r.movers_status<>'completed' THEN RAISE EXCEPTION 'Movers not ready'; END IF;
 IF r.digest_status='completed' THEN RETURN (SELECT count(*)::integer FROM weekly_digest_preparations WHERE run_id=p_run); END IF;
 INSERT INTO weekly_digest_preparations(run_id,user_id,content_identity,eligibility)
 SELECT p_run,x.user_id,'weekly-movers:'||p_run::text,x.eligibility FROM jsonb_to_recordset(p_recipients) AS x(user_id uuid,eligibility text) ON CONFLICT DO NOTHING;
 SELECT count(*) INTO n FROM weekly_digest_preparations WHERE run_id=p_run;
 UPDATE nadac_import_runs SET digest_status='completed',status='processing',failure_reason=NULL WHERE id=p_run;
 RETURN n;
END $$;
CREATE FUNCTION public.nadac_finalize_run(p_run uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r nadac_import_runs; prev_date date;
BEGIN
 PERFORM pg_advisory_xact_lock(87101017);
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' THEN RETURN; END IF;
 IF r.search_status<>'completed' OR r.movers_status<>'completed' OR r.homepage_status<>'completed' OR r.digest_status<>'completed' THEN RAISE EXCEPTION 'All stages must succeed before publication'; END IF;
 IF r.baseline THEN UPDATE nadac_import_runs SET freshness_status='completed',status='completed',completed_at=now() WHERE id=p_run; RETURN; END IF;
 IF EXISTS(SELECT 1 FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE c.source_date>=r.source_date AND c.id<>p_run) THEN RAISE EXCEPTION 'Cannot publish an older release'; END IF;
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
END $$;
CREATE FUNCTION public.nadac_fail_run(p_run uuid,p_stage text,p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_stage NOT IN('search','movers','homepage','digest','freshness') THEN RAISE EXCEPTION 'Invalid stage'; END IF;
 UPDATE nadac_import_runs SET status='failed',failure_reason=left(p_stage||': '||p_reason,2000),
 search_status=CASE WHEN p_stage='search' THEN 'failed' ELSE search_status END,
 movers_status=CASE WHEN p_stage='movers' THEN 'failed' ELSE movers_status END,
 homepage_status=CASE WHEN p_stage='homepage' THEN 'failed' ELSE homepage_status END,
 digest_status=CASE WHEN p_stage='digest' THEN 'failed' ELSE digest_status END,
 freshness_status=CASE WHEN p_stage='freshness' THEN 'failed' ELSE freshness_status END
 WHERE id=p_run AND status<>'completed';
END $$;
CREATE FUNCTION public.nadac_public_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; pending_date date; latest date; n bigint;
BEGIN
 SELECT c.* INTO r FROM nadac_publication b JOIN nadac_import_runs c ON c.id=b.current_run_id WHERE b.id=1 AND c.status='completed';
 SELECT max(source_date) INTO pending_date FROM nadac_import_runs WHERE NOT baseline AND status<>'completed' AND (r.source_date IS NULL OR source_date>r.source_date);
 SELECT max(effective_date) INTO latest FROM nadac_drugs;
 IF latest>coalesce(r.source_date,'1900-01-01'::date) THEN pending_date=greatest(pending_date,latest); END IF;
 SELECT public.nadac_ndc_count() INTO n;
 RETURN jsonb_build_object('runId',r.id,'currentDate',r.source_date,'previousDate',(SELECT source_date FROM nadac_import_runs WHERE id=r.previous_run_id),'completedAt',r.completed_at,
 'pendingDate',pending_date,'totalRecords',n,'topIncreases',CASE WHEN pending_date IS NULL THEN coalesce(r.top_increases,'[]') ELSE '[]'::jsonb END,
 'topDecreases',CASE WHEN pending_date IS NULL THEN coalesce(r.top_decreases,'[]') ELSE '[]'::jsonb END,'totalChanged',r.total_changed,
 'added',r.added_count,'removed',r.removed_count,'nonComparable',r.non_comparable_count);
END $$;
REVOKE ALL ON FUNCTION public.nadac_begin_run(date,text,integer,uuid,boolean,boolean),public.nadac_stage_records(uuid,jsonb),public.nadac_validate_run(uuid),public.nadac_compare_run(uuid),public.nadac_prepare_digest(uuid,jsonb),public.nadac_finalize_run(uuid),public.nadac_fail_run(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_begin_run(date,text,integer,uuid,boolean,boolean),public.nadac_stage_records(uuid,jsonb),public.nadac_validate_run(uuid),public.nadac_compare_run(uuid),public.nadac_prepare_digest(uuid,jsonb),public.nadac_finalize_run(uuid),public.nadac_fail_run(uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.nadac_public_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nadac_public_status() TO anon,authenticated,service_role;
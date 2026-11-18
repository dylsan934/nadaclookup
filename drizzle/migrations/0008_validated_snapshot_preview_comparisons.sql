CREATE OR REPLACE FUNCTION public.nadac_compare_run(p_run uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; prev nadac_import_runs; inc jsonb; dec jsonb;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND OR r.search_status<>'completed' THEN RAISE EXCEPTION 'Release not validated'; END IF;
 IF r.movers_status='completed' THEN RETURN; END IF;
 IF r.baseline THEN UPDATE nadac_import_runs SET movers_status='completed',homepage_status='completed' WHERE id=p_run; RETURN; END IF;
 SELECT * INTO prev FROM nadac_import_runs WHERE id=r.previous_run_id;
 IF prev.id IS NULL OR prev.validation_status<>'completed' OR prev.source_date<>r.source_date-7 THEN RAISE EXCEPTION 'Immediately preceding validated release required; comparison unavailable'; END IF;
 WITH pairs AS (
 SELECT c.ndc AS c_ndc,p.ndc AS p_ndc,c.nadac_per_unit AS new_price,p.nadac_per_unit AS old_price,(c.drug_name=p.drug_name AND c.pricing_unit=p.pricing_unit AND c.pharmacy_type=p.pharmacy_type AND p.nadac_per_unit>0) AS comparable
 FROM (SELECT * FROM nadac_release_records WHERE run_id=p_run) c FULL JOIN (SELECT * FROM nadac_release_records WHERE run_id=r.previous_run_id) p ON p.ndc=c.ndc
 ) UPDATE nadac_import_runs SET added_count=(SELECT count(*) FROM pairs WHERE p_ndc IS NULL),removed_count=(SELECT count(*) FROM pairs WHERE c_ndc IS NULL),non_comparable_count=(SELECT count(*) FROM pairs WHERE c_ndc IS NOT NULL AND p_ndc IS NOT NULL AND NOT comparable),unchanged_count=(SELECT count(*) FROM pairs WHERE comparable AND new_price=old_price),total_changed=(SELECT count(*) FROM pairs WHERE comparable AND new_price<>old_price) WHERE id=p_run;
 WITH changed AS (
 SELECT DISTINCT ON(c.drug_name) c.ndc,c.drug_name,c.pricing_unit,p.nadac_per_unit old_price,c.nadac_per_unit new_price,round((c.nadac_per_unit-p.nadac_per_unit)/p.nadac_per_unit*100,2) pct
 FROM nadac_release_records c JOIN nadac_release_records p ON p.run_id=r.previous_run_id AND c.ndc=p.ndc WHERE c.run_id=p_run AND c.drug_name=p.drug_name AND c.pricing_unit=p.pricing_unit AND c.pharmacy_type=p.pharmacy_type AND p.nadac_per_unit>0 AND c.nadac_per_unit<>p.nadac_per_unit ORDER BY c.drug_name,abs((c.nadac_per_unit-p.nadac_per_unit)/p.nadac_per_unit) DESC,c.ndc
 ), ranked AS (SELECT jsonb_build_object('ndc',ndc,'drugName',drug_name,'oldPrice',old_price,'newPrice',new_price,'pctChange',pct,'pricingUnit',pricing_unit) obj,pct FROM changed)
 SELECT coalesce((SELECT jsonb_agg(obj ORDER BY pct DESC) FROM (SELECT * FROM ranked WHERE pct>0 ORDER BY pct DESC LIMIT 10) x),'[]'),coalesce((SELECT jsonb_agg(obj ORDER BY pct) FROM (SELECT * FROM ranked WHERE pct<0 ORDER BY pct LIMIT 10) x),'[]') INTO inc,dec;
 UPDATE nadac_import_runs SET top_increases=inc,top_decreases=dec,movers_status='completed',homepage_status='completed',status='processing',failure_reason=NULL WHERE id=p_run;
END $$;
CREATE OR REPLACE FUNCTION public.nadac_link_previous(p_run uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r nadac_import_runs; p uuid;
BEGIN
 SELECT * INTO r FROM nadac_import_runs WHERE id=p_run FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown run'; END IF;
 IF r.status='completed' OR r.baseline OR r.movers_status='completed' THEN RETURN; END IF;
 SELECT id INTO p FROM nadac_import_runs WHERE source_date=r.source_date-7 AND validation_status='completed' AND artifact_verified ORDER BY started_at LIMIT 1;
 IF p IS NULL THEN RAISE EXCEPTION 'Immediately preceding validated release required; comparison unavailable'; END IF;
 UPDATE nadac_import_runs SET previous_run_id=p WHERE id=p_run;
END $$;
REVOKE ALL ON FUNCTION public.nadac_compare_run(uuid),public.nadac_link_previous(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nadac_compare_run(uuid),public.nadac_link_previous(uuid) TO service_role;
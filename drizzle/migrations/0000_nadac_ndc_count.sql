CREATE OR REPLACE FUNCTION public.nadac_ndc_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT count(DISTINCT ndc) FROM public.nadac_drugs $$;
GRANT EXECUTE ON FUNCTION public.nadac_ndc_count() TO anon, authenticated, service_role;
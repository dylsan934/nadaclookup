CREATE OR REPLACE FUNCTION public.compute_weekly_movers()
RETURNS TABLE(
  cur_date date,
  prev_date date,
  ndc text,
  drug_name text,
  old_price numeric,
  new_price numeric,
  pct_change numeric,
  pricing_unit text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cur AS (
    SELECT max(effective_date) AS d FROM public.nadac_drugs
  ),
  new_rows AS (
    SELECT DISTINCT ON (n.ndc)
      n.ndc, n.drug_name, n.nadac_per_unit, n.pricing_unit
    FROM public.nadac_drugs n CROSS JOIN cur
    WHERE n.effective_date = cur.d
    ORDER BY n.ndc, n.nadac_per_unit DESC
  ),
  prior AS (
    SELECT DISTINCT ON (n.ndc)
      n.ndc, n.nadac_per_unit, n.effective_date
    FROM public.nadac_drugs n CROSS JOIN cur
    WHERE n.effective_date < cur.d
      AND EXISTS (SELECT 1 FROM new_rows nr WHERE nr.ndc = n.ndc)
    ORDER BY n.ndc, n.effective_date DESC
  )
  SELECT
    (SELECT d FROM cur),
    (SELECT max(effective_date) FROM prior),
    nr.ndc,
    nr.drug_name,
    pr.nadac_per_unit,
    nr.nadac_per_unit,
    round(((nr.nadac_per_unit - pr.nadac_per_unit) / pr.nadac_per_unit) * 100, 2),
    COALESCE(nr.pricing_unit, 'EA')
  FROM new_rows nr
  JOIN prior pr ON pr.ndc = nr.ndc
  WHERE pr.nadac_per_unit > 0
    AND pr.nadac_per_unit <> nr.nadac_per_unit;
$$;

GRANT EXECUTE ON FUNCTION public.compute_weekly_movers() TO service_role;
CREATE OR REPLACE FUNCTION public.compute_weekly_movers()
RETURNS TABLE (
  cur_date date,
  prev_date date,
  ndc text,
  drug_name text,
  old_price numeric,
  new_price numeric,
  pct_change numeric,
  pricing_unit text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
  found_any boolean;
BEGIN
  -- CMS publishes both full weekly snapshots and small incremental corrections.
  -- Walk back from the newest published effective date and use the most recent one
  -- that actually contains price changes versus each NDC's own previous published price.
  FOR d IN
    SELECT DISTINCT n.effective_date
    FROM public.nadac_drugs n
    ORDER BY n.effective_date DESC
    LIMIT 8
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM public.nadac_drugs c
      JOIN LATERAL (
        SELECT p.nadac_per_unit, p.effective_date
        FROM public.nadac_drugs p
        WHERE p.ndc = c.ndc AND p.effective_date < d
        ORDER BY p.effective_date DESC
        LIMIT 1
      ) prev ON true
      WHERE c.effective_date = d
        AND prev.nadac_per_unit IS NOT NULL
        AND prev.nadac_per_unit <> 0
        AND prev.nadac_per_unit <> c.nadac_per_unit
    ) INTO found_any;

    IF found_any THEN
      RETURN QUERY
      SELECT
        d AS cur_date,
        max(prev.effective_date) OVER () AS prev_date,
        c.ndc,
        c.drug_name,
        prev.nadac_per_unit AS old_price,
        c.nadac_per_unit AS new_price,
        round(((c.nadac_per_unit - prev.nadac_per_unit) / prev.nadac_per_unit) * 100, 2) AS pct_change,
        coalesce(c.pricing_unit, 'EA') AS pricing_unit
      FROM public.nadac_drugs c
      JOIN LATERAL (
        SELECT p.nadac_per_unit, p.effective_date
        FROM public.nadac_drugs p
        WHERE p.ndc = c.ndc AND p.effective_date < d
        ORDER BY p.effective_date DESC
        LIMIT 1
      ) prev ON true
      WHERE c.effective_date = d
        AND prev.nadac_per_unit IS NOT NULL
        AND prev.nadac_per_unit <> 0
        AND prev.nadac_per_unit <> c.nadac_per_unit;
      RETURN;
    END IF;
  END LOOP;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_weekly_movers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_weekly_movers() TO service_role;
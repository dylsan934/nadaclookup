CREATE TABLE public.calculation_usage (
  user_id uuid NOT NULL,
  month date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month)
);

GRANT SELECT ON public.calculation_usage TO authenticated;
GRANT ALL ON public.calculation_usage TO service_role;

ALTER TABLE public.calculation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calculation usage"
ON public.calculation_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_calc_usage()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
  v_count integer;
BEGIN
  INSERT INTO public.calculation_usage (user_id, month, count)
  VALUES (auth.uid(), v_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = calculation_usage.count + 1, updated_at = now()
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_calc_usage() TO authenticated;
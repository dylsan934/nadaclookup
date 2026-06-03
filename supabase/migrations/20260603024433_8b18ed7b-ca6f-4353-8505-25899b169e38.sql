
CREATE TYPE public.reimbursement_cost_basis AS ENUM ('nadac', 'nadac_adjusted', 'manual');
CREATE TYPE public.reimbursement_adjustment_type AS ENUM ('plus_pct', 'minus_pct', 'none');

CREATE TABLE public.reimbursement_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cost_basis public.reimbursement_cost_basis NOT NULL DEFAULT 'nadac',
  adjustment_type public.reimbursement_adjustment_type NOT NULL DEFAULT 'none',
  percentage_value NUMERIC NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1,
  dispensing_fee NUMERIC NOT NULL DEFAULT 0,
  flat_adjustment NUMERIC NOT NULL DEFAULT 0,
  minimum_reimbursement NUMERIC,
  maximum_reimbursement NUMERIC,
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reimbursement_rules TO authenticated;
GRANT ALL ON public.reimbursement_rules TO service_role;

ALTER TABLE public.reimbursement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rules" ON public.reimbursement_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own rules" ON public.reimbursement_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rules" ON public.reimbursement_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own rules" ON public.reimbursement_rules FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX reimbursement_rules_one_default_per_user
  ON public.reimbursement_rules (user_id) WHERE is_default = true;

CREATE TRIGGER update_reimbursement_rules_updated_at
  BEFORE UPDATE ON public.reimbursement_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reimbursement_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  drug_name TEXT NOT NULL,
  ndc TEXT NOT NULL,
  nadac_unit_price NUMERIC NOT NULL,
  nadac_effective_date DATE,
  quantity NUMERIC NOT NULL,
  ingredient_cost NUMERIC NOT NULL,
  rule_id UUID,
  rule_name_snapshot TEXT NOT NULL,
  estimated_reimbursement NUMERIC NOT NULL,
  actual_reimbursement NUMERIC,
  difference NUMERIC,
  gross_margin NUMERIC,
  margin_percentage NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reimbursement_calculations TO authenticated;
GRANT ALL ON public.reimbursement_calculations TO service_role;

ALTER TABLE public.reimbursement_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own calcs" ON public.reimbursement_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own calcs" ON public.reimbursement_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own calcs" ON public.reimbursement_calculations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX reimbursement_calculations_user_created_idx
  ON public.reimbursement_calculations (user_id, created_at DESC);

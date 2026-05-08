
CREATE TABLE public.weekly_movers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  effective_date DATE NOT NULL UNIQUE,
  previous_date DATE NOT NULL,
  top_increases JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_decreases JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_changed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_movers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly movers"
  ON public.weekly_movers
  FOR SELECT
  USING (true);

-- Create ful_prices table for Federal Upper Limit pricing data
CREATE TABLE public.ful_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ndc_11 text NOT NULL,
  ful_unit_price numeric NOT NULL,
  package_size numeric DEFAULT 1,
  effective_date date NOT NULL,
  source_file_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint to prevent duplicates
ALTER TABLE public.ful_prices 
  ADD CONSTRAINT ful_prices_ndc_effective_unique UNIQUE (ndc_11, effective_date);

-- Create index for fast NDC lookups
CREATE INDEX idx_ful_prices_ndc_11 ON public.ful_prices (ndc_11);

-- Create index for effective date queries
CREATE INDEX idx_ful_prices_effective_date ON public.ful_prices (effective_date DESC);

-- Enable Row Level Security
ALTER TABLE public.ful_prices ENABLE ROW LEVEL SECURITY;

-- Public SELECT policy (FUL is government data)
CREATE POLICY "Anyone can view FUL pricing"
  ON public.ful_prices
  FOR SELECT
  USING (true);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_ful_prices_updated_at
  BEFORE UPDATE ON public.ful_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
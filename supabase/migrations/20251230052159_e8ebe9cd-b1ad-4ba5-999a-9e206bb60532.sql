-- Create table for NADAC drug pricing data
CREATE TABLE public.nadac_drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ndc TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  nadac_per_unit NUMERIC(12, 6) NOT NULL,
  effective_date DATE NOT NULL,
  pricing_unit TEXT,
  pharmacy_type TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ndc, effective_date)
);

-- Create index for fast searching by drug name
CREATE INDEX idx_nadac_drugs_drug_name ON public.nadac_drugs USING gin(to_tsvector('english', drug_name));

-- Create index for NDC lookups
CREATE INDEX idx_nadac_drugs_ndc ON public.nadac_drugs(ndc);

-- Create index for effective date to get latest prices
CREATE INDEX idx_nadac_drugs_effective_date ON public.nadac_drugs(effective_date DESC);

-- Enable Row Level Security (public read access for drug pricing)
ALTER TABLE public.nadac_drugs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read drug pricing data (public information)
CREATE POLICY "Anyone can view drug pricing"
ON public.nadac_drugs
FOR SELECT
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_nadac_drugs_updated_at
BEFORE UPDATE ON public.nadac_drugs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
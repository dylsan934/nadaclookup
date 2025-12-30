-- Add columns to track last notified price for alerts
ALTER TABLE public.saved_drugs 
ADD COLUMN last_notified_price NUMERIC,
ADD COLUMN last_notified_at TIMESTAMP WITH TIME ZONE;

-- Create price alerts log table
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  saved_drug_id UUID REFERENCES public.saved_drugs(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  ndc TEXT NOT NULL,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  price_change_percent NUMERIC NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own price alerts"
ON public.price_alerts
FOR SELECT
USING (auth.uid() = user_id);
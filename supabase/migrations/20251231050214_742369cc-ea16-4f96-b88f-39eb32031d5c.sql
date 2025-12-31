-- Add calculator_qty column to saved_drugs table
ALTER TABLE public.saved_drugs 
ADD COLUMN calculator_qty NUMERIC DEFAULT NULL;
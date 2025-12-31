-- Add alerts_enabled column to saved_drugs table
ALTER TABLE public.saved_drugs 
ADD COLUMN alerts_enabled BOOLEAN NOT NULL DEFAULT true;
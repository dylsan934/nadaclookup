-- Create saved_drugs table for users to save drugs they want to monitor
CREATE TABLE public.saved_drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ndc TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ndc)
);

-- Enable RLS
ALTER TABLE public.saved_drugs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own saved drugs"
ON public.saved_drugs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved drugs"
ON public.saved_drugs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved drugs"
ON public.saved_drugs
FOR DELETE
USING (auth.uid() = user_id);
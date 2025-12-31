-- Add notes column to saved_drugs table
ALTER TABLE public.saved_drugs ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create drug_categories table
CREATE TABLE public.drug_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on drug_categories
ALTER TABLE public.drug_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for drug_categories
CREATE POLICY "Users can view their own categories"
ON public.drug_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.drug_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.drug_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.drug_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create junction table for saved drugs and categories (many-to-many)
CREATE TABLE public.saved_drug_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  saved_drug_id UUID NOT NULL REFERENCES public.saved_drugs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.drug_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(saved_drug_id, category_id)
);

-- Enable RLS on saved_drug_categories
ALTER TABLE public.saved_drug_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_drug_categories (check via saved_drugs ownership)
CREATE POLICY "Users can view their saved drug categories"
ON public.saved_drug_categories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.saved_drugs 
    WHERE saved_drugs.id = saved_drug_id 
    AND saved_drugs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add categories to their saved drugs"
ON public.saved_drug_categories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.saved_drugs 
    WHERE saved_drugs.id = saved_drug_id 
    AND saved_drugs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove categories from their saved drugs"
ON public.saved_drug_categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.saved_drugs 
    WHERE saved_drugs.id = saved_drug_id 
    AND saved_drugs.user_id = auth.uid()
  )
);

-- Add UPDATE policy for saved_drugs so users can edit notes
CREATE POLICY "Users can update their own saved drugs"
ON public.saved_drugs
FOR UPDATE
USING (auth.uid() = user_id);
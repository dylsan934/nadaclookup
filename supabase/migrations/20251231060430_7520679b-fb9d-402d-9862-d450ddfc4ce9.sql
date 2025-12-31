-- Add notification preference columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN notify_saved_drugs BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN notify_large_changes_only BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN large_change_threshold NUMERIC NOT NULL DEFAULT 5;
-- Add trial columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN trial_ends_at timestamptz DEFAULT NULL,
ADD COLUMN trial_granted_by uuid DEFAULT NULL;
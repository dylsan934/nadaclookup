-- Add lifetime_saves_count to profiles table to track total saves ever made (doesn't decrease on delete)
ALTER TABLE public.profiles 
ADD COLUMN lifetime_saves_count integer NOT NULL DEFAULT 0;

-- Create a trigger function to increment lifetime_saves_count when a drug is saved
CREATE OR REPLACE FUNCTION public.increment_lifetime_saves()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET lifetime_saves_count = lifetime_saves_count + 1
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_drug_saved
  AFTER INSERT ON public.saved_drugs
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_lifetime_saves();

-- Create a function to check if user can save more drugs (server-side enforcement)
CREATE OR REPLACE FUNCTION public.can_save_drug(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT lifetime_saves_count < 3 FROM public.profiles WHERE user_id = p_user_id),
    true
  );
$$;
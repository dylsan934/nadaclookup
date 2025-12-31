-- Remove the overly permissive INSERT policy
-- The edge function uses service role which bypasses RLS, so no INSERT policy is needed
DROP POLICY IF EXISTS "System can create price alerts for users" ON public.price_alerts;
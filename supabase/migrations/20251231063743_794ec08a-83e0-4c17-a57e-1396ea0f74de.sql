-- Add INSERT policy for price_alerts table
-- This allows the system/edge functions to create price alerts for users
CREATE POLICY "System can create price alerts for users"
ON public.price_alerts
FOR INSERT
WITH CHECK (true);
-- Add read_at column to track which price alerts have been read
ALTER TABLE public.price_alerts 
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
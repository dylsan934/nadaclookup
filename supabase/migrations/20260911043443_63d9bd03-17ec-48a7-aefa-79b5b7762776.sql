SELECT cron.unschedule(1);
SELECT cron.schedule(
  'weekly-nadac-sync',
  '0 6 * * 3',
  $$
  SELECT net.http_post(
    url := 'https://wcbzqrskgfszkwgrzogo.supabase.co/functions/v1/sync-nadac',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "a5688a87dca280d51d771872a0827865edcae90c41f0bf00412b7d7ee634e74d"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
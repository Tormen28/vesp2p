SELECT cron.schedule(
  'binance-p2p-scraper',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/scraper',
    headers := '{"Authorization": "Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
);

-- Auto-purge notifications older than 90 days (requires pg_cron extension)
SELECT cron.schedule(
  'purge-old-notifications',
  '0 3 * * *',
  $$
    DELETE FROM public.notifications
    WHERE created_at < now() - INTERVAL '90 days';
  $$
);

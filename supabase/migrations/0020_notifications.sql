-- In-app notifications. Soft read. Auto-purged after 90 days via pg_cron.
CREATE TABLE public.notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  recipient_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          public.notification_type NOT NULL,
  title         text NOT NULL,
  body          text NOT NULL,
  entity_type   text,
  entity_id     uuid,
  is_read       boolean NOT NULL DEFAULT false,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_recipient_idx
  ON public.notifications (recipient_id, is_read, created_at DESC);

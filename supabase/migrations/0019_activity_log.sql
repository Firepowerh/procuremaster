-- Immutable audit trail. Append-only. Full before/after JSONB diff.
CREATE TABLE public.activity_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  actor_id     uuid,
  actor_type   text,
  entity_type  public.activity_entity NOT NULL,
  entity_id    uuid NOT NULL,
  action       text NOT NULL,
  description  text NOT NULL,
  before_state jsonb,
  after_state  jsonb,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- activity_log is APPEND-ONLY — no updates or deletes ever
CREATE INDEX activity_log_org_idx     ON public.activity_log (org_id, created_at DESC);
CREATE INDEX activity_log_entity_idx  ON public.activity_log (entity_type, entity_id);
CREATE INDEX activity_log_actor_idx   ON public.activity_log (actor_id);

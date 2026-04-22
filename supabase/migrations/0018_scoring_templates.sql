-- Org-level reusable criteria templates
CREATE TABLE public.scoring_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  name          text NOT NULL,
  criteria      jsonb NOT NULL,  -- array of {name, description, weight, sort_order}
  last_used_at  timestamptz,
  is_deleted    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

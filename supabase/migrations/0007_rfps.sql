-- Core procurement event
CREATE TABLE public.rfps (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  requirement_id       uuid REFERENCES public.requirements(id) ON DELETE SET NULL,
  title                text NOT NULL,
  description          text NOT NULL,
  department           text NOT NULL,
  budget_min           numeric(15,2),
  budget_max           numeric(15,2),
  submission_deadline  timestamptz,
  status               public.rfp_status NOT NULL DEFAULT 'rfp_created',
  is_deleted           boolean NOT NULL DEFAULT false,
  -- Full-text search
  search_vector        tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(department, ''))
  ) STORED,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Add FK from requirements to rfps now that rfps exists
ALTER TABLE public.requirements
  ADD CONSTRAINT requirements_linked_rfp_fk
  FOREIGN KEY (linked_rfp_id) REFERENCES public.rfps(id) ON DELETE SET NULL;

CREATE INDEX rfps_search_idx       ON public.rfps USING GIN (search_vector);
CREATE INDEX rfps_org_status_idx   ON public.rfps (org_id, status) WHERE is_deleted = false;

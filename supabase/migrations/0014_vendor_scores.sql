-- AI score + PM override per criterion per vendor
CREATE TABLE public.vendor_scores (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  evaluation_id           uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  criterion_id            uuid NOT NULL REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE,
  vendor_account_id       uuid NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  scoring_run             int NOT NULL DEFAULT 1,
  -- AI score
  ai_score                numeric(4,2),
  ai_reasoning            text,
  ai_scored_at            timestamptz,
  -- PM override
  override_score          numeric(4,2),
  override_justification  text,
  overridden_by           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  overridden_at           timestamptz,
  -- Effective score (AI score unless overridden)
  effective_score         numeric(4,2) GENERATED ALWAYS AS (
    COALESCE(override_score, ai_score)
  ) STORED,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, criterion_id, vendor_account_id, scoring_run)
);

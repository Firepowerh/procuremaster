-- One per RFP. Holds criteria state and report output.
CREATE TABLE public.evaluations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rfp_id                 uuid UNIQUE NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  status                 public.evaluation_status NOT NULL DEFAULT 'not_started',
  criteria_confirmed_at  timestamptz,
  criteria_confirmed_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scoring_run_count      int NOT NULL DEFAULT 0,
  last_scored_at         timestamptz,
  -- Report output
  report_executive_summary  text,
  report_recommendation     text,
  report_generated_at       timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

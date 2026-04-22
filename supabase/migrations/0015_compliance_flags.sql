-- AI-detected compliance risks, one row per flag per document
CREATE TABLE public.compliance_flags (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  document_id      uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  flag_type        public.flag_type NOT NULL,
  severity         public.flag_severity NOT NULL,
  clause_text      text,
  explanation      text NOT NULL,
  status           public.flag_status NOT NULL DEFAULT 'open',
  acknowledged_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX compliance_flags_document_idx  ON public.compliance_flags (document_id);
CREATE INDEX compliance_flags_status_idx    ON public.compliance_flags (status, severity);

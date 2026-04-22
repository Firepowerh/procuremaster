-- Contract record, created automatically on approval
CREATE TABLE public.contracts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rfp_id               uuid REFERENCES public.rfps(id) ON DELETE SET NULL,
  vendor_account_id    uuid NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  approval_request_id  uuid REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  title                text NOT NULL,
  value                numeric(15,2),
  currency             text NOT NULL DEFAULT 'USD',
  payment_terms        text,
  start_date           date NOT NULL,
  end_date             date NOT NULL,
  alert_days           int NOT NULL DEFAULT 90,
  status               public.contract_status NOT NULL DEFAULT 'active',
  document_path        text,
  terminated_at        timestamptz,
  terminated_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  termination_reason   text,
  is_deleted           boolean NOT NULL DEFAULT false,
  -- Full-text search
  search_vector        tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, ''))
  ) STORED,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfp_id, vendor_account_id)
);

CREATE INDEX contracts_search_idx    ON public.contracts USING GIN (search_vector);
CREATE INDEX contracts_end_date_idx  ON public.contracts (end_date, status) WHERE is_deleted = false;

-- One submission per vendor per RFP
CREATE TABLE public.submissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rfp_id               uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  vendor_account_id    uuid NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  rfp_vendor_entry_id  uuid NOT NULL REFERENCES public.rfp_vendor_entries(id) ON DELETE CASCADE,
  status               public.submission_status NOT NULL DEFAULT 'in_progress',
  submitted_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfp_id, vendor_account_id)
);

-- Join table: one row per vendor per RFP, tracks pipeline stage
CREATE TABLE public.rfp_vendor_entries (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rfp_id             uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  vendor_account_id  uuid NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  status             public.vendor_pipeline_status NOT NULL DEFAULT 'invited',
  is_shortlisted     boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfp_id, vendor_account_id)
);

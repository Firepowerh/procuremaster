-- Approval workflow record, one per submission cycle
CREATE TABLE public.approval_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rfp_id              uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  vendor_account_id   uuid NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  evaluation_id       uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  submitted_by        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_to        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status              public.approval_status NOT NULL DEFAULT 'pending',
  sla_due_at          timestamptz NOT NULL,
  decision_comment    text,
  rejection_reason    public.rejection_reason,
  decided_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at          timestamptz,
  recalled_at         timestamptz,
  recalled_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Only one PENDING approval per RFP at a time
CREATE UNIQUE INDEX one_pending_approval_per_rfp
  ON public.approval_requests (rfp_id)
  WHERE status = 'pending';

-- Enable RLS and define policies for all tables

-- organisations
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read" ON public.organisations
  FOR SELECT USING (id = public.get_org_id() AND public.is_internal());

CREATE POLICY "org_update" ON public.organisations
  FOR UPDATE USING (id = public.get_org_id() AND public.is_pm());

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read" ON public.profiles
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_pm());

-- vendor_accounts
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_accounts_internal_read" ON public.vendor_accounts
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "vendor_accounts_self_read" ON public.vendor_accounts
  FOR SELECT USING (auth_user_id = auth.uid() AND public.is_vendor());

CREATE POLICY "vendor_accounts_pm_write" ON public.vendor_accounts
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- vendor_invites
ALTER TABLE public.vendor_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_invites_internal_read" ON public.vendor_invites
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "vendor_invites_pm_write" ON public.vendor_invites
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- requirements
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requirements_internal_read" ON public.requirements
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal() AND is_deleted = false);

CREATE POLICY "requirements_dh_insert" ON public.requirements
  FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "requirements_dh_update" ON public.requirements
  FOR UPDATE USING (
    org_id = public.get_org_id() AND
    public.is_internal() AND
    (raised_by = auth.uid() OR public.is_pm())
  );

-- rfps
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfps_internal_read" ON public.rfps
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal() AND is_deleted = false);

CREATE POLICY "rfps_pm_write" ON public.rfps
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- rfp_vendor_entries
ALTER TABLE public.rfp_vendor_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rve_internal_read" ON public.rfp_vendor_entries
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "rve_pm_write" ON public.rfp_vendor_entries
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

CREATE POLICY "rve_vendor_read" ON public.rfp_vendor_entries
  FOR SELECT USING (
    public.is_vendor() AND
    vendor_account_id = (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_internal_read" ON public.submissions
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "submissions_vendor_read" ON public.submissions
  FOR SELECT USING (
    public.is_vendor() AND
    vendor_account_id = (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "submissions_vendor_update" ON public.submissions
  FOR UPDATE USING (
    public.is_vendor() AND status = 'in_progress' AND
    vendor_account_id = (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "submissions_vendor_insert" ON public.submissions
  FOR INSERT WITH CHECK (
    public.is_vendor() AND
    vendor_account_id = (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_internal_read" ON public.documents
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "documents_vendor_own" ON public.documents
  FOR ALL USING (
    public.is_vendor() AND
    submission_id IN (
      SELECT id FROM public.submissions WHERE
        vendor_account_id = (
          SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
        )
    )
  );

-- evaluations
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations_read" ON public.evaluations
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "evaluations_pm_write" ON public.evaluations
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- evaluation_criteria
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "criteria_read" ON public.evaluation_criteria
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "criteria_pm_write" ON public.evaluation_criteria
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- vendor_scores
ALTER TABLE public.vendor_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_read" ON public.vendor_scores
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "scores_pm_write" ON public.vendor_scores
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- compliance_flags
ALTER TABLE public.compliance_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_internal_read" ON public.compliance_flags
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

CREATE POLICY "flags_pm_write" ON public.compliance_flags
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- approval_requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals_read" ON public.approval_requests
  FOR SELECT USING (
    org_id = public.get_org_id() AND
    public.get_user_role() IN ('procurement_manager', 'finance_approver')
  );

CREATE POLICY "approvals_pm_insert" ON public.approval_requests
  FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_pm());

CREATE POLICY "approvals_pm_recall" ON public.approval_requests
  FOR UPDATE USING (org_id = public.get_org_id() AND public.is_pm() AND status = 'pending');

CREATE POLICY "approvals_fa_decide" ON public.approval_requests
  FOR UPDATE USING (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'finance_approver' AND
    status = 'pending'
  );

-- contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_pm" ON public.contracts
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm() AND is_deleted = false);

CREATE POLICY "contracts_fa_read" ON public.contracts
  FOR SELECT USING (
    org_id = public.get_org_id() AND
    public.get_user_role() = 'finance_approver' AND
    is_deleted = false
  );

-- scoring_templates
ALTER TABLE public.scoring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_read" ON public.scoring_templates
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_pm() AND is_deleted = false);

CREATE POLICY "templates_pm_write" ON public.scoring_templates
  FOR ALL USING (org_id = public.get_org_id() AND public.is_pm());

-- activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_internal_read" ON public.activity_log
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_internal());

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_recipient" ON public.notifications
  FOR ALL USING (recipient_id = auth.uid() AND public.is_internal());

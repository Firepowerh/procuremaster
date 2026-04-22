-- Fix submissions_vendor_update RLS policy.
-- Without a WITH CHECK clause, PostgreSQL reuses the USING expression for both
-- the old-row filter AND the new-row check. The USING requires status = 'in_progress',
-- so after updating status to 'submitted' the new-row check fails with an RLS error.
-- Fix: drop and recreate the policy with an explicit WITH CHECK that only verifies
-- ownership, allowing any status transition initiated by the owning vendor.

DROP POLICY IF EXISTS "submissions_vendor_update" ON public.submissions;

CREATE POLICY "submissions_vendor_update" ON public.submissions
  FOR UPDATE
  USING (
    public.is_vendor()
    AND status = 'in_progress'
    AND vendor_account_id = (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_vendor()
    AND vendor_account_id = (
      SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

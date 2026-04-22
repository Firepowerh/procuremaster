-- Allow vendors to read RFPs they have been invited to.
-- Without this, the vendor portal's rfps join returns null for every entry
-- and no cards are shown.
CREATE POLICY "rfps_vendor_read" ON public.rfps
  FOR SELECT USING (
    public.is_vendor() AND
    EXISTS (
      SELECT 1 FROM public.rfp_vendor_entries rve
      WHERE rve.rfp_id = rfps.id
        AND rve.vendor_account_id = (
          SELECT id FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
        )
    )
  );

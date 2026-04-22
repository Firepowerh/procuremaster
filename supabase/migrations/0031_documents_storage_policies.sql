-- Add storage RLS policies for the `documents` bucket.
-- The upload path is: {orgId}/{rfpId}/{vendorAccountId}/{timestamp}_{filename}
-- foldername[1] = orgId, foldername[2] = rfpId, foldername[3] = vendorAccountId

-- Vendors can upload to their own folder
CREATE POLICY "documents_vendor_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_vendor()
    AND (storage.foldername(name))[3] = (
      SELECT id::text FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- Vendors can read their own uploads
CREATE POLICY "documents_vendor_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND public.is_vendor()
    AND (storage.foldername(name))[3] = (
      SELECT id::text FROM public.vendor_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- Internal users (PM, dept head, finance) can read all documents in their org
CREATE POLICY "documents_internal_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND public.is_internal()
    AND (storage.foldername(name))[1] = public.get_org_id()::text
  );

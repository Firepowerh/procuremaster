-- Create three private storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('vendor-documents',   'vendor-documents',   false),
  ('org-assets',         'org-assets',         false),
  ('contract-documents', 'contract-documents', false);

-- vendor-documents: vendors can upload to their org path
CREATE POLICY "vendor_docs_vendor_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_vendor()
  );

-- vendor-documents: internal users can read all files in their org
CREATE POLICY "vendor_docs_internal_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_internal()
  );

-- vendor-documents: vendors can read their own org files
CREATE POLICY "vendor_docs_vendor_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_vendor()
  );

-- vendor-documents: vendors can delete their own uploads (pre-submission)
CREATE POLICY "vendor_docs_vendor_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_vendor()
  );

-- org-assets: PM can upload/manage org logo
CREATE POLICY "org_assets_pm_write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'org-assets' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_pm()
  );

CREATE POLICY "org_assets_internal_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'org-assets' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_internal()
  );

-- contract-documents: PM can upload/manage contract files
CREATE POLICY "contract_docs_pm_write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'contract-documents' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_pm()
  );

CREATE POLICY "contract_docs_internal_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contract-documents' AND
    (storage.foldername(name))[1] = public.get_org_id()::text AND
    public.is_internal()
  );

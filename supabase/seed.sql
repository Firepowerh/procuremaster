-- ============================================================
-- ProcureMaster — Local Development Seed Data
-- Run with: supabase db seed
-- ============================================================

-- Disable triggers via replication role so we can insert known UUIDs without side effects
-- (session_replication_role=replica requires superuser, which postgres has locally)
SET session_replication_role = replica;

-- Create test auth.users (local dev only — superuser can insert directly)
-- Token columns must be '' not NULL — GoTrue scans them as non-nullable strings.
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, reauthentication_token,
  phone_change, phone_change_token
) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'pm@procuremaster.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alex Manager","role":"procurement_manager"}',
    'authenticated', 'authenticated', now(), now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'dh@procuremaster.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dana Head","role":"department_head"}',
    'authenticated', 'authenticated', now(), now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'fa@procuremaster.test',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Chris Finance","role":"finance_approver"}',
    'authenticated', 'authenticated', now(), now(),
    '', '', '', '', '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Restore normal trigger behaviour
SET session_replication_role = DEFAULT;

-- Test organisation
INSERT INTO public.organisations (id, name, slug, currency)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Acme Corp',
  'acme-corp',
  'USD'
) ON CONFLICT (id) DO NOTHING;

-- Internal user profiles
INSERT INTO public.profiles (id, org_id, full_name, role, onboarding_complete)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Alex Manager',
  'procurement_manager',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, org_id, full_name, role)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Dana Head',
  'department_head'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, org_id, full_name, role)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Chris Finance',
  'finance_approver'
) ON CONFLICT (id) DO NOTHING;

-- Vendor accounts (not yet accepted)
INSERT INTO public.vendor_accounts (id, org_id, company_name, contact_name, email, is_active)
VALUES
  (
    'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'TechSupply Ltd',
    'Sam Vendor',
    'sam@techsupply.test',
    false
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Global Solutions Inc',
    'Pat Global',
    'pat@globalsolutions.test',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Sample requirement
INSERT INTO public.requirements (
  id, org_id, raised_by, title, description, department,
  budget_estimate, required_by, priority, status
)
VALUES (
  'dddddddd-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'Cloud Storage Solution',
  'We need a scalable cloud storage solution for document management.',
  'IT',
  50000.00,
  (CURRENT_DATE + INTERVAL '60 days')::date,
  'high',
  'submitted'
) ON CONFLICT (id) DO NOTHING;

-- Sample RFP (triggers auto-creation of evaluation record)
INSERT INTO public.rfps (
  id, org_id, created_by, requirement_id,
  title, description, department,
  budget_min, budget_max, submission_deadline, status
)
VALUES (
  'eeeeeeee-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'dddddddd-0000-0000-0000-000000000001',
  'Cloud Storage Vendor RFP',
  'Request for proposals for a cloud storage and document management solution.',
  'IT',
  20000.00,
  60000.00,
  (now() + INTERVAL '14 days'),
  'vendors_invited'
) ON CONFLICT (id) DO NOTHING;

-- Link requirement to RFP
UPDATE public.requirements
SET linked_rfp_id = 'eeeeeeee-0000-0000-0000-000000000001'
WHERE id = 'dddddddd-0000-0000-0000-000000000001';

-- RFP vendor entries
INSERT INTO public.rfp_vendor_entries (id, org_id, rfp_id, vendor_account_id, status)
VALUES
  (
    'ffffffff-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'eeeeeeee-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'invited'
  ),
  (
    'ffffffff-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'eeeeeeee-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000002',
    'invited'
  )
ON CONFLICT (id) DO NOTHING;

-- Helper functions for RLS policies

CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$;

CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'user_type';
$$;

CREATE OR REPLACE FUNCTION public.is_pm()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT public.get_user_role() = 'procurement_manager';
$$;

CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT public.get_user_type() = 'internal';
$$;

CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT public.get_user_type() = 'vendor';
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create org + profile on first PM signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_id   uuid;
  v_role     public.user_role;
  v_org_name text;
BEGIN
  v_role     := (NEW.raw_user_meta_data ->> 'role')::public.user_role;
  v_org_name := NEW.raw_user_meta_data ->> 'org_name';
  v_org_id   := (NEW.raw_user_meta_data ->> 'org_id')::uuid;

  IF v_role = 'procurement_manager' AND v_org_id IS NULL THEN
    INSERT INTO public.organisations (name, slug, currency)
    VALUES (
      v_org_name,
      lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]', '-', 'g')),
      COALESCE(NEW.raw_user_meta_data ->> 'currency', 'USD')
    )
    RETURNING id INTO v_org_id;
  END IF;

  INSERT INTO public.profiles (id, org_id, full_name, role)
  VALUES (
    NEW.id,
    v_org_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    v_role
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create evaluation when RFP is created
CREATE OR REPLACE FUNCTION public.create_evaluation_for_rfp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.evaluations (org_id, rfp_id)
  VALUES (NEW.org_id, NEW.id);
  RETURN NEW;
END;
$$;

-- Auto-create contract when approval is approved
CREATE OR REPLACE FUNCTION public.create_contract_on_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_rfp rfps%ROWTYPE;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    SELECT * INTO v_rfp FROM public.rfps WHERE id = NEW.rfp_id;

    INSERT INTO public.contracts (
      org_id, rfp_id, vendor_account_id, approval_request_id,
      title, start_date, end_date, currency
    ) VALUES (
      NEW.org_id,
      NEW.rfp_id,
      NEW.vendor_account_id,
      NEW.id,
      v_rfp.title || ' — Contract',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      COALESCE((
        SELECT currency FROM public.organisations WHERE id = NEW.org_id
      ), 'USD')
    );

    UPDATE public.rfp_vendor_entries
    SET status = 'contracted'
    WHERE rfp_id = NEW.rfp_id AND vendor_account_id = NEW.vendor_account_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Validate criteria weights do not exceed 100%
CREATE OR REPLACE FUNCTION public.validate_criteria_weights()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(weight), 0) INTO v_total
  FROM public.evaluation_criteria
  WHERE evaluation_id = NEW.evaluation_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  v_total := v_total + NEW.weight;

  IF v_total > 100.01 THEN
    RAISE EXCEPTION 'Criteria weights cannot exceed 100%%: current total %', v_total;
  END IF;

  RETURN NEW;
END;
$$;

-- Contract expiry status updater (called by daily cron)
CREATE OR REPLACE FUNCTION public.process_contract_renewals()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r            contracts%ROWTYPE;
  v_pm_id      uuid;
  v_days_remaining int;
BEGIN
  FOR r IN
    SELECT * FROM public.contracts
    WHERE status IN ('active', 'expiring_soon')
      AND is_deleted = false
  LOOP
    v_days_remaining := (r.end_date - CURRENT_DATE);

    IF v_days_remaining <= r.alert_days AND r.status = 'active' THEN
      UPDATE public.contracts SET status = 'expiring_soon' WHERE id = r.id;

      SELECT id INTO v_pm_id FROM public.profiles
        WHERE org_id = r.org_id AND role = 'procurement_manager' AND is_active = true
        LIMIT 1;

      INSERT INTO public.notifications
        (org_id, recipient_id, type, title, body, entity_type, entity_id)
      VALUES (
        r.org_id, v_pm_id, 'renewal_alert',
        'Contract expiring in ' || v_days_remaining || ' days',
        r.title || ' expires on ' || r.end_date::text,
        'contract', r.id
      );
    END IF;

    IF v_days_remaining <= 0 AND r.status != 'expired' THEN
      UPDATE public.contracts SET status = 'expired' WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$;

-- Custom access token hook — injects user_type, role, org_id into JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claims   jsonb;
  v_profile  profiles%ROWTYPE;
  v_vendor   vendor_accounts%ROWTYPE;
BEGIN
  claims := event -> 'claims';

  SELECT * INTO v_profile FROM public.profiles
    WHERE id = (event ->> 'user_id')::uuid AND is_active = true;

  IF FOUND THEN
    claims := jsonb_set(claims, '{app_metadata}', jsonb_build_object(
      'user_type', 'internal',
      'role',      v_profile.role,
      'org_id',    v_profile.org_id
    ));
  ELSE
    SELECT * INTO v_vendor FROM public.vendor_accounts
      WHERE auth_user_id = (event ->> 'user_id')::uuid AND is_active = true;

    IF FOUND THEN
      claims := jsonb_set(claims, '{app_metadata}', jsonb_build_object(
        'user_type', 'vendor',
        'role',      'vendor',
        'org_id',    v_vendor.org_id
      ));
    END IF;
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

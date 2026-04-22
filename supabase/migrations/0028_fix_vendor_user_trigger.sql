-- Fix handle_new_user trigger to skip profile creation for vendor users.
-- Vendor auth users are created via the invite accept flow and have no role
-- in their metadata — their identity is in vendor_accounts, not profiles.
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

  -- Vendor users have no role in metadata — skip profile creation entirely.
  -- Their identity is stored in vendor_accounts, linked via auth_user_id.
  IF v_role IS NULL THEN
    RETURN NEW;
  END IF;

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

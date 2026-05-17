-- Atomic signup function using SECURITY DEFINER to bypass RLS.
-- Called from the mobile app signup flow. Still enforces auth.uid() check.
CREATE OR REPLACE FUNCTION public.create_org_and_profile(
  p_org_name  TEXT,
  p_slug      TEXT,
  p_currency  TEXT,
  p_full_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id  UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organisations (name, slug, currency)
  VALUES (p_org_name, p_slug, p_currency)
  RETURNING id INTO v_org_id;

  INSERT INTO public.profiles (id, org_id, full_name, role, onboarding_complete)
  VALUES (v_user_id, v_org_id, p_full_name, 'procurement_manager', false);

  RETURN json_build_object('org_id', v_org_id, 'user_id', v_user_id);
END;
$$;

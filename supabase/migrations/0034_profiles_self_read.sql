-- Allow users to always read their own profile row.
-- This is independent of JWT claims (org_id/role), so it works even before
-- the custom_access_token_hook is enabled or after a fresh signup.
CREATE POLICY "profiles_read_self" ON public.profiles
  FOR SELECT USING (id = auth.uid());

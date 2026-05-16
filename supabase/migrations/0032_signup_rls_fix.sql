-- Fix RLS policies to allow new user signup flow.
-- New users have no org_id or role in their JWT yet, so the existing
-- policies (which rely on get_org_id() and is_pm()) block signup.

-- Allow any authenticated user to create an organisation
CREATE POLICY "org_insert" ON public.organisations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Replace the existing profiles insert policy (which required is_pm() + get_org_id())
-- with one that simply lets a user insert their own profile row.
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

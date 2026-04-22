-- Register the custom_access_token_hook with Supabase Auth.
-- After running this migration you must also enable it manually in:
-- Supabase Dashboard → Authentication → Hooks → custom_access_token
-- and set the function to: public.custom_access_token_hook

-- The function itself is created in 0022_functions.sql.
-- This migration just ensures the correct grants are in place.

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon;

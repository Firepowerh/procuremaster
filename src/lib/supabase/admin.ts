import { createClient } from '@supabase/supabase-js'

// Service-role client — NEVER expose to the browser.
// Only import this in server-only files (Server Components, Actions, Route Handlers).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/auth-store'

// Only manages auth state — no navigation logic here.
// Each screen handles its own redirects.
export function useAuth() {
  const { setSession, fetchProfile, reset } = useAuthStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          reset()
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])
}

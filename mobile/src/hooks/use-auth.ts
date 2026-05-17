import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/auth-store'

export function useAuth() {
  const { session, profile, isLoading, setSession, fetchProfile, reset } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    let mounted = true

    // Immediately check existing session from AsyncStorage
    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      if (!mounted) return
      setSession(existing)
      if (existing?.user) {
        await fetchProfile(existing.user.id)
      }
      useAuthStore.setState({ isLoading: false })
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return // handled by getSession above
        setSession(newSession)
        if (newSession?.user) {
          try {
            await fetchProfile(newSession.user.id)
          } catch {
            // ignore
          }
        } else {
          reset()
        }
        useAuthStore.setState({ isLoading: false })
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!session || !profile) {
      if (!inAuthGroup) router.replace('/(auth)/login')
    } else if (!profile.onboarding_complete) {
      if (!inOnboarding) router.replace('/onboarding')
    } else {
      if (inAuthGroup || inOnboarding) router.replace('/(app)/dashboard')
    }
  }, [session, profile, isLoading, segments])

  return { session, profile, isLoading }
}

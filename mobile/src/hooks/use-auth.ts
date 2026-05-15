import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/auth-store'

export function useAuth() {
  const { session, profile, isLoading, setSession, fetchProfile, reset } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if (newSession?.user) {
          try {
            await fetchProfile(newSession.user.id)
          } catch (error) {
            console.error('Failed to fetch profile:', error)
          }
        } else {
          reset()
        }

        useAuthStore.setState({ isLoading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, fetchProfile, reset])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
    } else if (profile && !profile.onboarding_complete) {
      if (!inOnboarding) router.replace('/onboarding')
    } else if (profile?.onboarding_complete) {
      if (inAuthGroup || inOnboarding) router.replace('/(app)/dashboard')
    }
  }, [session, profile, isLoading, segments])

  return { session, profile, isLoading }
}

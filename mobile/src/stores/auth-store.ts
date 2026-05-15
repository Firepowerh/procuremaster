import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'

interface Profile {
  id: string
  org_id: string
  full_name: string
  role: string
  onboarding_complete: boolean
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,

  setSession: (session) => set({ session }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, org_id, full_name, role, onboarding_complete')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('fetchProfile error:', error)
      return
    }
    if (data) {
      set({ profile: data as Profile })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },

  reset: () => set({ session: null, profile: null, isLoading: false }),
}))

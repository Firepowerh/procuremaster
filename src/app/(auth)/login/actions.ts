'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  // Check profile for role + onboarding status (also works before JWT hook is wired up)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    // No internal profile — check for vendor account
    const { data: vendor } = await supabase
      .from('vendor_accounts')
      .select('id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (vendor) redirect('/vendor/portal')
    return { error: 'Account not found. Contact your administrator.' }
  }

  if (profile.role === 'procurement_manager' && !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

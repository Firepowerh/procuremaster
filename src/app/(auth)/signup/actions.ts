'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signupAction(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const orgName = formData.get('orgName') as string
  const currency = formData.get('currency') as string

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'procurement_manager',
        org_name: orgName,
        currency: currency || 'USD',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message, needsConfirmation: false }
  }

  // Email confirmation pending — tell the user to check their inbox
  if (!data.session) {
    return { error: null, needsConfirmation: true }
  }

  redirect('/onboarding')
}

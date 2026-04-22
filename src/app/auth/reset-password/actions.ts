'use server'

import { createClient } from '@/lib/supabase/server'

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  })

  if (error) {
    return { error: error.message, sent: false }
  }

  // Always return sent=true to avoid email enumeration
  return { sent: true, error: null }
}

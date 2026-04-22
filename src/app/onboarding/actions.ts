'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function updateOrgAction(formData: FormData) {
  const orgName = formData.get('orgName') as string
  const currency = formData.get('currency') as string

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'Organisation not found.' }

  const { error } = await supabase
    .from('organisations')
    .update({ name: orgName, currency })
    .eq('id', profile.org_id)

  if (error) return { error: error.message }

  return { success: true }
}

export async function inviteTeamMemberAction(formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: 'Organisation not found.' }

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
    data: { full_name: fullName, role, org_id: profile.org_id },
  })

  if (error) return { error: error.message }

  return { success: true, invited: email }
}

export async function completeOnboardingAction() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', user.id)

  redirect('/dashboard')
}

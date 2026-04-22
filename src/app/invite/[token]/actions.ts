'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function acceptVendorInviteAction(formData: FormData) {
  const token = formData.get('token') as string
  const inviteId = formData.get('inviteId') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  // Re-validate the invite server-side
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('vendor_invites')
    .select('id, vendor_account_id, status, expires_at')
    .eq('token', token)
    .eq('id', inviteId)
    .maybeSingle()

  if (inviteError || !invite || invite.status !== 'pending') {
    return { error: 'This invite is no longer valid.' }
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: 'This invite has expired. Please request a new one.' }
  }

  // Get the vendor account to find the org
  const { data: vendorAccount } = await supabaseAdmin
    .from('vendor_accounts')
    .select('id, org_id, email')
    .eq('id', invite.vendor_account_id)
    .single()

  if (!vendorAccount) {
    return { error: 'Vendor account not found.' }
  }

  // Create the auth user
  const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email: email || vendorAccount.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  // Link auth user to vendor account and activate it
  const { error: linkError } = await supabaseAdmin
    .from('vendor_accounts')
    .update({ auth_user_id: authData.user.id, contact_name: fullName, is_active: true })
    .eq('id', invite.vendor_account_id)

  if (linkError) {
    return { error: 'Failed to link account. Please contact support.' }
  }

  // Mark invite as accepted
  await supabaseAdmin
    .from('vendor_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId)

  // Sign in the new user
  const supabase = createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email || vendorAccount.email,
    password,
  })

  if (signInError) {
    return { error: 'Account created but sign-in failed. Try logging in manually.' }
  }

  redirect('/vendor/portal')
}

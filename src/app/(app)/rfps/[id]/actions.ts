'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

// ── Status transition ──────────────────────────────────────────────────────────

export async function updateRfpStatusAction(
  rfpId: string,
  status: string
): Promise<{ error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'procurement_manager') return { error: 'Forbidden' }

  const { error } = await supabase
    .from('rfps')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', rfpId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath(`/rfps/${rfpId}`)
  revalidatePath('/rfps')
  return {}
}

// ── Invite vendor ─────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email(),
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
})

export async function inviteVendorToRfpAction(
  rfpId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'procurement_manager') return { error: 'Forbidden' }

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    company_name: formData.get('company_name'),
    contact_name: formData.get('contact_name'),
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const { email, company_name, contact_name } = parsed.data
  const orgId = profile.org_id as string

  // Check if vendor_account exists for this org + email
  let { data: vendorAccount } = await supabase
    .from('vendor_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email)
    .single()

  // Create vendor account if not exists
  if (!vendorAccount) {
    const { data: newVa, error: vaErr } = await supabase
      .from('vendor_accounts')
      .insert({ org_id: orgId, company_name, contact_name, email })
      .select('id')
      .single()
    if (vaErr) return { error: vaErr.message }
    vendorAccount = newVa
  }

  // Check not already in this RFP
  const { data: existing } = await supabase
    .from('rfp_vendor_entries')
    .select('id')
    .eq('rfp_id', rfpId)
    .eq('vendor_account_id', vendorAccount.id)
    .single()

  if (existing) return { error: 'Vendor already invited to this RFP' }

  // Create rfp_vendor_entry
  const { error: entryErr } = await supabase.from('rfp_vendor_entries').insert({
    org_id: orgId,
    rfp_id: rfpId,
    vendor_account_id: vendorAccount.id,
    status: 'invited',
  })
  if (entryErr) return { error: entryErr.message }

  // Create vendor_invite with a secure token (expires in 7 days)
  // profile.id === user.id in this system (profiles use auth UUID as PK)
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: inviteErr } = await supabaseAdmin
    .from('vendor_invites')
    .insert({
      org_id: orgId,
      rfp_id: rfpId,
      vendor_account_id: vendorAccount.id,
      invited_by: user.id,
      token,
      expires_at: expiresAt,
    })
  if (inviteErr) return { error: inviteErr.message }

  // Send invite email via Resend
  const { data: rfp } = await supabase.from('rfps').select('title').eq('id', rfpId).single()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/invite/${token}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@procuremaster.ai',
      to: email,
      subject: `Invitation to submit a proposal: ${rfp?.title ?? 'RFP'}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>You've been invited to submit a proposal</h2>
          <p>Hi ${contact_name},</p>
          <p>You have been invited to submit a proposal for <strong>${rfp?.title ?? 'an RFP'}</strong>.</p>
          <p>Click the button below to create your account and access the vendor portal:</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
            Accept Invitation
          </a>
          <p style="color:#64748b;font-size:13px">This link expires in 7 days.</p>
        </div>
      `,
    })
  } catch {
    // Email failure is non-fatal — invite record is created, PM can share link manually
  }

  revalidatePath(`/rfps/${rfpId}`)
  return {}
}

// ── Update vendor pipeline status ─────────────────────────────────────────────

export async function updateVendorStatusAction(
  entryId: string,
  rfpId: string,
  status: string
): Promise<{ error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'procurement_manager') return { error: 'Forbidden' }

  const { error } = await supabase
    .from('rfp_vendor_entries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath(`/rfps/${rfpId}`)
  return {}
}

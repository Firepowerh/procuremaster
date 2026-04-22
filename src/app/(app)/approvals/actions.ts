'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function decideApprovalAction(
  approvalId: string,
  decision: 'approved' | 'rejected',
  comment?: string,
  rejectionReason?: string
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

  if (!profile) return { error: 'Profile not found' }
  if (profile.role !== 'finance_approver' && profile.role !== 'procurement_manager') {
    return { error: 'Forbidden' }
  }

  const { data: approval } = await supabase
    .from('approval_requests')
    .select('org_id, status, rfp_id, vendor_account_id')
    .eq('id', approvalId)
    .single()

  if (!approval) return { error: 'Not found' }
  if (approval.org_id !== profile.org_id) return { error: 'Forbidden' }
  if (approval.status !== 'pending') return { error: 'Already decided' }

  const { error } = await supabase
    .from('approval_requests')
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      decision_comment: comment || null,
      rejection_reason: decision === 'rejected' ? (rejectionReason ?? 'other') : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalId)

  if (error) return { error: error.message }

  // If approved, advance RFP + auto-create contract
  if (decision === 'approved') {
    await supabase
      .from('rfps')
      .update({ status: 'contracted' })
      .eq('id', approval.rfp_id)

    // Fetch RFP details for contract title/values
    const { data: rfp } = await supabase
      .from('rfps')
      .select('title, budget_max, org_id')
      .eq('id', approval.rfp_id)
      .single()

    if (rfp) {
      const today = new Date()
      const endDate = new Date(today)
      endDate.setFullYear(endDate.getFullYear() + 1) // default 1-year term

      await supabase.from('contracts').upsert(
        {
          org_id: rfp.org_id,
          rfp_id: approval.rfp_id,
          vendor_account_id: approval.vendor_account_id,
          approval_request_id: approvalId,
          title: rfp.title,
          value: rfp.budget_max ?? null,
          start_date: today.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
        },
        { onConflict: 'rfp_id,vendor_account_id' }
      )
    }
  }

  revalidatePath('/approvals')
  revalidatePath('/contracts')
  revalidatePath(`/rfps/${approval.rfp_id}`)
  return {}
}

export async function recallApprovalAction(
  approvalId: string
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
    .from('approval_requests')
    .update({
      status: 'recalled',
      recalled_by: user.id,
      recalled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .eq('org_id', profile.org_id as string)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/approvals')
  return {}
}

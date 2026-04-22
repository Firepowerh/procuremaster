'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function createEvaluationAction(
  rfpId: string
): Promise<{ id?: string; error?: string }> {
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

  // Check no existing evaluation for this RFP
  const { data: existing } = await supabase
    .from('evaluations')
    .select('id')
    .eq('rfp_id', rfpId)
    .single()

  if (existing) return { id: existing.id }

  const { data, error } = await supabase
    .from('evaluations')
    .insert({
      org_id: profile.org_id,
      rfp_id: rfpId,
      status: 'criteria_pending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Advance RFP to under_evaluation
  await supabase.from('rfps').update({ status: 'under_evaluation' }).eq('id', rfpId)

  revalidatePath('/evaluations')
  return { id: data.id }
}

export async function updateCriterionAction(
  criterionId: string,
  updates: { name?: string; description?: string; weight?: number }
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
    .from('evaluation_criteria')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', criterionId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }
  return {}
}

export async function deleteCriterionAction(
  criterionId: string,
  evaluationId: string
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
    .from('evaluation_criteria')
    .delete()
    .eq('id', criterionId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath(`/evaluations/${evaluationId}`)
  return {}
}

export async function addCriterionAction(
  evaluationId: string,
  name: string,
  description: string,
  weight: number
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

  // Get next sort_order
  const { count } = await supabase
    .from('evaluation_criteria')
    .select('*', { count: 'exact', head: true })
    .eq('evaluation_id', evaluationId)

  const { error } = await supabase.from('evaluation_criteria').insert({
    org_id: profile.org_id,
    evaluation_id: evaluationId,
    name,
    description,
    weight,
    sort_order: (count ?? 0) + 1,
    is_ai_suggested: false,
  })

  if (error) return { error: error.message }

  revalidatePath(`/evaluations/${evaluationId}`)
  return {}
}

export async function overrideScoreAction(
  scoreId: string,
  evaluationId: string,
  overrideScore: number,
  justification: string
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
    .from('vendor_scores')
    .update({
      override_score: overrideScore,
      override_justification: justification,
      overridden_by: user.id,
      overridden_at: new Date().toISOString(),
    })
    .eq('id', scoreId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath(`/evaluations/${evaluationId}`)
  return {}
}

export async function sendForApprovalAction(
  evaluationId: string,
  vendorAccountId: string,
  submittedToId: string,
  slaDays: number
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

  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('rfp_id, org_id')
    .eq('id', evaluationId)
    .single()

  if (!evaluation) return { error: 'Evaluation not found' }

  const slaDate = new Date()
  slaDate.setDate(slaDate.getDate() + slaDays)

  const { error } = await supabase.from('approval_requests').insert({
    org_id: profile.org_id,
    rfp_id: evaluation.rfp_id,
    vendor_account_id: vendorAccountId,
    evaluation_id: evaluationId,
    submitted_by: user.id,
    submitted_to: submittedToId,
    status: 'pending',
    sla_due_at: slaDate.toISOString(),
  })

  if (error) return { error: error.message }

  // Advance RFP status
  await supabase
    .from('rfps')
    .update({ status: 'approval_pending' })
    .eq('id', evaluation.rfp_id)

  revalidatePath('/approvals')
  revalidatePath(`/evaluations/${evaluationId}`)
  return {}
}

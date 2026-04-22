'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateRequirementStatusAction(
  requirementId: string,
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

  if (!profile) return { error: 'Profile not found' }

  // Only PM can change status (except DH can submit their own drafts)
  const { data: req } = await supabase
    .from('requirements')
    .select('raised_by, status, org_id')
    .eq('id', requirementId)
    .single()

  if (!req) return { error: 'Requirement not found' }
  if (req.org_id !== profile.org_id) return { error: 'Forbidden' }

  const isDH = profile.role === 'department_head'
  if (isDH) {
    // DH can only submit their own draft
    if (req.raised_by !== user.id) return { error: 'Forbidden' }
    if (status !== 'submitted') return { error: 'Forbidden' }
    if (req.status !== 'draft') return { error: 'Already submitted' }
  }

  const { error } = await supabase
    .from('requirements')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requirementId)

  if (error) return { error: error.message }

  revalidatePath(`/requirements/${requirementId}`)
  revalidatePath('/requirements')
  return {}
}

export async function deleteRequirementAction(
  requirementId: string
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

  const { data: req } = await supabase
    .from('requirements')
    .select('raised_by, org_id, status')
    .eq('id', requirementId)
    .single()

  if (!req) return { error: 'Not found' }
  if (req.org_id !== profile.org_id) return { error: 'Forbidden' }

  // Only PM or the DH who raised it (if draft) can delete
  const canDelete =
    profile.role === 'procurement_manager' ||
    (profile.role === 'department_head' && req.raised_by === user.id && req.status === 'draft')

  if (!canDelete) return { error: 'Forbidden' }

  const { error } = await supabase
    .from('requirements')
    .update({ is_deleted: true })
    .eq('id', requirementId)

  if (error) return { error: error.message }

  revalidatePath('/requirements')
  return {}
}

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  department: z.string().min(1),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  submission_deadline: z.string().optional(),
  requirement_id: z.string().uuid().optional().or(z.literal('')),
})

export type CreateRfpState = { errors?: Record<string, string[]>; error?: string } | null

export async function createRfpAction(
  _prev: CreateRfpState,
  formData: FormData
): Promise<CreateRfpState> {
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

  if (!profile || profile.role !== 'procurement_manager') return { error: 'Insufficient permissions' }

  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    department: formData.get('department') as string,
    budget_min: (formData.get('budget_min') ?? '') as string,
    budget_max: (formData.get('budget_max') ?? '') as string,
    submission_deadline: (formData.get('submission_deadline') ?? '') as string,
    requirement_id: (formData.get('requirement_id') ?? '') as string,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const d = parsed.data

  const { data: rfp, error } = await supabase
    .from('rfps')
    .insert({
      org_id: profile.org_id,
      created_by: user.id,
      title: d.title,
      description: d.description,
      department: d.department,
      budget_min: d.budget_min ? parseFloat(d.budget_min) : null,
      budget_max: d.budget_max ? parseFloat(d.budget_max) : null,
      submission_deadline: d.submission_deadline || null,
      requirement_id: d.requirement_id || null,
      status: 'rfp_created',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  if (!rfp) return { error: 'RFP was created but could not be retrieved. Please check the RFPs list.' }

  // If linked to a requirement, update its status
  if (d.requirement_id) {
    await supabase
      .from('requirements')
      .update({ linked_rfp_id: rfp.id, status: 'in_progress' })
      .eq('id', d.requirement_id)
  }

  redirect(`/rfps/${rfp.id}`)
}

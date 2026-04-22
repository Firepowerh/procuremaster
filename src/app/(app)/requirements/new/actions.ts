'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  budget_estimate: z.string().optional(),
  required_by: z.string().optional(),
  submit: z.enum(['draft', 'submitted']).optional(),
})

export type CreateRequirementState = {
  errors?: Record<string, string[]>
  error?: string
} | null

export async function createRequirementAction(
  _prev: CreateRequirementState,
  formData: FormData
): Promise<CreateRequirementState> {
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
  if (profile.role === 'finance_approver') return { error: 'Insufficient permissions' }

  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    department: formData.get('department') as string,
    priority: formData.get('priority') as string,
    budget_estimate: (formData.get('budget_estimate') ?? '') as string,
    required_by: (formData.get('required_by') ?? '') as string,
    submit: (formData.get('submit') ?? '') as string,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const d = parsed.data
  const status = d.submit === 'submitted' ? 'submitted' : 'draft'

  const { data: req, error } = await supabase
    .from('requirements')
    .insert({
      org_id: profile.org_id,
      raised_by: user.id,
      title: d.title,
      description: d.description,
      department: d.department,
      priority: d.priority,
      status,
      budget_estimate: d.budget_estimate ? parseFloat(d.budget_estimate) : null,
      required_by: d.required_by || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/requirements/${req.id}`)
}

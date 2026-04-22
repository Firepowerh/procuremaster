'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const editSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.string().optional(),
  currency: z.string().length(3).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  payment_terms: z.string().optional(),
  alert_days: z.string().optional(),
})

export async function updateContractAction(
  contractId: string,
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

  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([, v]) => v !== '')
  )
  const parsed = editSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Invalid input' }

  const { value, alert_days, ...rest } = parsed.data
  const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
  if (value) updates.value = parseFloat(value)
  if (alert_days) updates.alert_days = parseInt(alert_days)

  const { error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', contractId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath(`/contracts/${contractId}`)
  revalidatePath('/contracts')
  return {}
}

export async function terminateContractAction(
  contractId: string,
  reason: string
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
    .from('contracts')
    .update({
      status: 'terminated',
      terminated_at: new Date().toISOString(),
      terminated_by: user.id,
      termination_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .eq('org_id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath('/contracts')
  return {}
}

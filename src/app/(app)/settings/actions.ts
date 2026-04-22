'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const profileSchema = z.object({
  full_name: z.string().min(1).max(120),
})

const orgSchema = z.object({
  name: z.string().min(1).max(120),
  currency: z.string().length(3),
})

export async function updateProfileAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return {}
}

export async function updateOrgAction(formData: FormData): Promise<{ error?: string }> {
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

  const parsed = orgSchema.safeParse({
    name: formData.get('name'),
    currency: formData.get('currency'),
  })
  if (!parsed.success) return { error: 'Invalid input' }

  const { error } = await supabase
    .from('organisations')
    .update({
      name: parsed.data.name,
      currency: parsed.data.currency.toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.org_id as string)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}

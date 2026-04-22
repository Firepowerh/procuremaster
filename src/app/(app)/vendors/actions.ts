'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createVendorSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
})

export async function createVendorAction(
  formData: FormData
): Promise<{ errors?: Record<string, string[]>; error?: string } | null> {
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

  const parsed = createVendorSchema.safeParse({
    company_name: formData.get('company_name'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const orgId = profile.org_id as string
  const { company_name, contact_name, email } = parsed.data

  // Check for duplicate email within org
  const { data: existing } = await supabase
    .from('vendor_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', email)
    .maybeSingle()

  if (existing) return { error: 'A vendor with this email already exists' }

  const { error } = await supabase.from('vendor_accounts').insert({
    org_id: orgId,
    company_name,
    contact_name,
    email,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/vendors')
  return null
}

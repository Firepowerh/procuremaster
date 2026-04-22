import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, org_id')
    .eq('id', user.id)
    .single()

  // Only procurement managers go through onboarding
  if (!profile || profile.role !== 'procurement_manager') redirect('/dashboard')

  // Already onboarded
  if (profile.onboarding_complete) redirect('/dashboard')

  const { data: org } = await supabase
    .from('organisations')
    .select('name, currency')
    .eq('id', profile.org_id!)
    .single()

  return (
    <OnboardingWizard
      orgName={org?.name ?? ''}
      currency={(org?.currency as string) ?? 'USD'}
    />
  )
}

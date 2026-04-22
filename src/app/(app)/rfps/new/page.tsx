import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import CreateRfpForm from './create-rfp-form'

export default async function NewRfpPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'procurement_manager') redirect('/rfps')

  // Fetch unlinked submitted requirements for linking
  const { data: requirements } = await supabase
    .from('requirements')
    .select('id, title, department')
    .eq('org_id', profile.org_id as string)
    .eq('status', 'submitted')
    .is('linked_rfp_id', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        href="/rfps"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to RFPs
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Create New RFP</CardTitle>
          <CardDescription>
            Define scope, budget, and deadline. You can invite vendors after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateRfpForm requirements={requirements ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}

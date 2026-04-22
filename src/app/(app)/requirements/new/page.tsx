import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import CreateRequirementForm from './create-requirement-form'

export default async function NewRequirementPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'finance_approver') redirect('/requirements')

  return (
    <div className="max-w-2xl space-y-4">
      <Link
        href="/requirements"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to Requirements
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">New Procurement Requirement</CardTitle>
          <CardDescription>
            Describe what your department needs. A procurement manager will review and create an
            RFP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateRequirementForm defaultDepartment={(profile as { department?: string }).department ?? ''} />
        </CardContent>
      </Card>
    </div>
  )
}

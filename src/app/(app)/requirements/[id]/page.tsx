import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Calendar, DollarSign, User, Building2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RequirementActions from './requirement-actions'

const PRIORITY_CLASS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  vendor_selected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  closed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
}

interface PageProps {
  params: { id: string }
}

export default async function RequirementDetailPage({ params }: PageProps) {
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

  if (!profile) redirect('/login')

  const { data: req } = await supabase
    .from('requirements')
    .select(
      'id, title, description, department, priority, status, budget_estimate, required_by, created_at, updated_at, raised_by, profiles(full_name), linked_rfp_id, rfps(id, title, status)'
    )
    .eq('id', params.id)
    .eq('org_id', profile.org_id as string)
    .eq('is_deleted', false)
    .single()

  if (!req) notFound()

  // DH can only see their own
  if (profile.role === 'department_head' && (req as { raised_by: string }).raised_by !== user.id) {
    notFound()
  }

  const r = (req as unknown) as {
    id: string
    title: string
    description: string
    department: string
    priority: string
    status: string
    budget_estimate: number | null
    required_by: string | null
    created_at: string
    updated_at: string
    raised_by: string
    profiles: { full_name: string } | null
    linked_rfp_id: string | null
    rfps: { id: string; title: string; status: string } | null
  }

  const isOwner = r.raised_by === user.id

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <Link
        href="/requirements"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to Requirements
      </Link>

      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[r.status]}`}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CLASS[r.priority]}`}
                >
                  {r.priority}
                </span>
              </div>
              <CardTitle className="font-heading text-xl">{r.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                Department
              </div>
              <span className="text-sm font-medium">{r.department}</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                Raised By
              </div>
              <span className="text-sm font-medium">{r.profiles?.full_name ?? '—'}</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                Budget
              </div>
              <span className="text-sm font-medium">
                {r.budget_estimate != null
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(r.budget_estimate)
                  : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Required By
              </div>
              <span className="text-sm font-medium">
                {r.required_by ? new Date(r.required_by).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {/* Linked RFP */}
          {r.rfps && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Linked RFP:</span>
              <Link
                href={`/rfps/${r.rfps.id}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {r.rfps.title}
              </Link>
              <span
                className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground`}
              >
                {r.rfps.status.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-1 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Updated {new Date(r.updated_at).toLocaleDateString()}
            </div>
            <RequirementActions
              requirementId={r.id}
              currentStatus={r.status}
              role={profile.role as string}
              isOwner={isOwner}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Calendar, DollarSign, Building2, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VendorPipeline from './vendor-pipeline'
import InviteVendorForm from './invite-vendor-form'
import RfpStatusActions from './rfp-status-actions'

const STATUS_CLASS: Record<string, string> = {
  requirements_received: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  rfp_created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  vendors_invited: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  submissions_in: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  under_evaluation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  shortlisted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  approval_pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  contracted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
}

interface PageProps {
  params: { id: string }
}

export default async function RfpDetailPage({ params }: PageProps) {
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

  const [{ data: rfp }, { data: entries }, { data: logs }] = await Promise.all([
    supabase
      .from('rfps')
      .select(
        'id, title, description, department, status, budget_min, budget_max, submission_deadline, created_at, updated_at, requirement_id, requirements!rfps_requirement_id_fkey(id, title)'
      )
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single(),
    supabase
      .from('rfp_vendor_entries')
      .select('id, status, vendor_accounts(company_name, email)')
      .eq('rfp_id', params.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('activity_log')
      .select('id, action, actor_id, metadata, created_at')
      .eq('entity_type', 'rfp')
      .eq('entity_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!rfp) notFound()

  const r = (rfp as unknown) as {
    id: string
    title: string
    description: string
    department: string
    status: string
    budget_min: number | null
    budget_max: number | null
    submission_deadline: string | null
    created_at: string
    updated_at: string
    requirement_id: string | null
    requirements: { id: string; title: string } | null
  }

  const isManager = profile.role === 'procurement_manager'

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/rfps"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to RFPs
      </Link>

      {/* Main card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="mb-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[r.status] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
              <CardTitle className="font-heading text-xl">{r.title}</CardTitle>
            </div>
            {isManager && (
              <RfpStatusActions rfpId={r.id} currentStatus={r.status} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
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
                <Calendar className="w-3.5 h-3.5" />
                Deadline
              </div>
              <span className="text-sm font-medium">
                {r.submission_deadline
                  ? new Date(r.submission_deadline).toLocaleDateString()
                  : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                Budget
              </div>
              <span className="text-sm font-medium">
                {r.budget_min != null && r.budget_max != null
                  ? `$${(r.budget_min / 1000).toFixed(0)}k – $${(r.budget_max / 1000).toFixed(0)}k`
                  : r.budget_max != null
                    ? `up to $${(r.budget_max / 1000).toFixed(0)}k`
                    : r.budget_min != null
                      ? `from $${(r.budget_min / 1000).toFixed(0)}k`
                      : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Updated
              </div>
              <span className="text-sm font-medium">
                {new Date(r.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Linked requirement */}
          {r.requirements && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">From requirement:</span>
              <Link
                href={`/requirements/${r.requirements.id}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {r.requirements.title}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity log */}
      {(logs ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {(logs ?? []).map((log) => {
                const meta = (log.metadata as Record<string, string> | null) ?? {}
                return (
                  <li key={log.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-0.5 w-3 h-3 rounded-full bg-muted border border-border" />
                    <p className="text-xs font-medium leading-snug">
                      {(log.action as string).replace(/_/g, ' ')}
                      {meta.status && (
                        <span className="ml-1 text-muted-foreground">→ {(meta.status as string).replace(/_/g, ' ')}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(log.created_at as string).toLocaleString()}
                    </p>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Vendor pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-sm font-medium">
              Vendor Pipeline ({(entries ?? []).length})
            </CardTitle>
            {isManager && <InviteVendorForm rfpId={r.id} />}
          </div>
        </CardHeader>
        <CardContent>
          <VendorPipeline
            rfpId={r.id}
            entries={(entries ?? []) as unknown as {
              id: string
              status: string
              vendor_accounts: { company_name: string; email: string } | null
            }[]}
            isManager={isManager}
          />
        </CardContent>
      </Card>
    </div>
  )
}

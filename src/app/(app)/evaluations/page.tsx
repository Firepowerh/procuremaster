import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Evaluations' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BarChart3, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import CreateEvaluationButton from './create-evaluation-button'

const STATUS_CLASS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  criteria_pending: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  scoring_in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  scored: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  report_generated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

export default async function EvaluationsPage() {
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

  if (!profile || profile.role !== 'procurement_manager') redirect('/dashboard')

  const orgId = profile.org_id as string

  const [{ data: evaluations }, { data: eligibleRfps }] = await Promise.all([
    supabase
      .from('evaluations')
      .select('id, status, created_at, scoring_run_count, rfps(id, title, department)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    // RFPs that are in submissions_in / under_evaluation but don't yet have an evaluation
    supabase
      .from('rfps')
      .select('id, title, department')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .in('status', ['submissions_in', 'under_evaluation', 'shortlisted']),
  ])

  // Filter eligible: not already having an evaluation
  const existingRfpIds = new Set((evaluations ?? []).map((e) => {
    const rfp = (e.rfps as unknown) as { id: string } | null
    return rfp?.id
  }).filter(Boolean))

  const canCreate = (eligibleRfps ?? []).filter((r) => !existingRfpIds.has(r.id))

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">Evaluations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Score and compare vendor proposals with AI assistance
          </p>
        </div>
        {canCreate.length > 0 && (
          <CreateEvaluationButton eligibleRfps={canCreate} orgId={orgId} />
        )}
      </div>

      {(evaluations ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">No evaluations yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create an evaluation once vendors have submitted proposals
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(evaluations ?? []).map((e) => {
            const rfp = (e.rfps as unknown) as { id: string; title: string; department: string } | null
            return (
              <Link key={e.id} href={`/evaluations/${e.id}`} className="block group">
                <Card className="transition-colors group-hover:border-primary/50">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {rfp?.title ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rfp?.department} · Run {e.scoring_run_count}×
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[e.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {e.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

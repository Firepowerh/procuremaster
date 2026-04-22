import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Approvals' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ApprovalActions from './approval-actions'

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  recalled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default async function ApprovalsPage() {
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

  const orgId = profile.org_id as string
  const role = profile.role as string

  let query = supabase
    .from('approval_requests')
    .select(
      'id, status, sla_due_at, decision_comment, rejection_reason, created_at, decided_at, rfps(id, title, department), vendor_accounts(company_name), submitted_by_profile:profiles!approval_requests_submitted_by_fkey(full_name), decided_by_profile:profiles!approval_requests_decided_by_fkey(full_name)'
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Finance approver only sees requests submitted to them
  if (role === 'finance_approver') {
    query = query.eq('submitted_to', user.id)
  }

  const { data: approvals } = await query

  const pending = (approvals ?? []).filter((a) => a.status === 'pending')
  const decided = (approvals ?? []).filter((a) => a.status !== 'pending')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Approvals</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {role === 'finance_approver'
            ? 'Approval requests awaiting your decision'
            : 'Approval requests across all RFPs'}
        </p>
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Pending ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending approvals</p>
        ) : (
          pending.map((a) => {
            const rfp = (a.rfps as unknown) as { id: string; title: string; department: string } | null
            const vendor = (a.vendor_accounts as unknown) as { company_name: string } | null
            const submitter = ((a as unknown) as { submitted_by_profile: { full_name: string } | null }).submitted_by_profile
            const isOverdue = new Date(a.sla_due_at) < new Date()

            return (
              <Card key={a.id} className={isOverdue ? 'border-destructive/50' : ''}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/rfps/${rfp?.id}`}
                          className="text-sm font-medium hover:text-primary transition-colors truncate"
                        >
                          {rfp?.title ?? 'RFP'}
                        </Link>
                        <span className="text-xs text-muted-foreground shrink-0">
                          · {rfp?.department}
                        </span>
                      </div>
                      {vendor && (
                        <p className="text-xs text-muted-foreground">{vendor.company_name}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className={`w-3 h-3 ${isOverdue ? 'text-destructive' : ''}`} />
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {isOverdue ? 'Overdue · ' : 'Due '}
                          {formatDistanceToNow(new Date(a.sla_due_at), { addSuffix: true })}
                        </span>
                        {submitter && (
                          <>
                            <span>·</span>
                            <span>From {submitter.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ApprovalActions
                      approvalId={a.id}
                      role={role}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Decided */}
      {decided.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Decided ({decided.length})
          </h3>
          {decided.map((a) => {
            const rfp = (a.rfps as unknown) as { id: string; title: string } | null
            const decidedBy = ((a as unknown) as { decided_by_profile: { full_name: string } | null }).decided_by_profile

            return (
              <Card key={a.id} className="opacity-80">
                <CardContent className="py-3 px-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/rfps/${rfp?.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors truncate"
                      >
                        {rfp?.title ?? 'RFP'}
                      </Link>
                      {a.decision_comment && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {a.decision_comment}
                        </p>
                      )}
                      {decidedBy && a.decided_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          By {decidedBy.full_name} ·{' '}
                          {formatDistanceToNow(new Date(a.decided_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[a.status] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

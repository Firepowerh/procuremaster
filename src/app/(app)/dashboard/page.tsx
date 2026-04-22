import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Dashboard' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText, ClipboardList, CheckSquare, FileSignature } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: number | string
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-heading font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}

// ── Status badge helper ────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'secondary',
  under_review: 'default',
  approved: 'default',
  rejected: 'destructive',
  vendors_invited: 'default',
  evaluating: 'secondary',
  pending: 'secondary',
  contracted: 'default',
  active: 'default',
  expiring_soon: 'destructive',
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const orgId = profile.org_id as string
  const role = profile.role as string

  // Parallel data fetches
  const [
    { count: reqCount },
    { count: rfpCount },
    { count: approvalCount },
    { count: contractCount },
    { data: recentRfps },
    { data: recentRequirements },
    { data: pendingApprovals },
  ] = await Promise.all([
    supabase
      .from('requirements')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('status', 'archived'),
    supabase
      .from('rfps')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('status', 'cancelled'),
    supabase
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'pending'),
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['active', 'expiring_soon']),
    supabase
      .from('rfps')
      .select('id, title, status, created_at, department')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('requirements')
      .select('id, title, status, priority, department, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('approval_requests')
      .select('id, rfp_id, status, created_at, rfps(title)')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .limit(5),
  ])

  const firstName = (profile.full_name as string).split(' ')[0]

  const stats = [
    {
      title: 'Active Requirements',
      value: reqCount ?? 0,
      sub: 'across all departments',
      icon: FileText,
      accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Open RFPs',
      value: rfpCount ?? 0,
      sub: 'in procurement pipeline',
      icon: ClipboardList,
      accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Pending Approvals',
      value: approvalCount ?? 0,
      sub: 'awaiting decision',
      icon: CheckSquare,
      accent:
        (approvalCount ?? 0) > 0
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          : 'bg-muted text-muted-foreground',
    },
    {
      title: 'Active Contracts',
      value: contractCount ?? 0,
      sub: 'managed by ProcureMaster',
      icon: FileSignature,
      accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 17
              ? 'afternoon'
              : 'evening'}
          , {firstName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your procurement pipeline today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Two-column activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFPs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent RFPs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentRfps ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No RFPs yet</p>
            ) : (
              (recentRfps ?? []).map((rfp) => (
                <div key={rfp.id} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{rfp.title}</p>
                    <p className="text-xs text-muted-foreground">{rfp.department}</p>
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[rfp.status] ?? 'secondary'}
                    className="text-[10px] shrink-0"
                  >
                    {rfp.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending approvals or recent requirements */}
        {role === 'procurement_manager' || role === 'finance_approver' ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(pendingApprovals ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No pending approvals
                </p>
              ) : (
                (pendingApprovals ?? []).map((a) => {
                  const rfpTitle =
                    a.rfps && typeof a.rfps === 'object' && 'title' in a.rfps
                      ? (a.rfps as { title: string }).title
                      : 'RFP'
                  return (
                    <div key={a.id} className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug flex-1 min-w-0 truncate">
                        {rfpTitle}
                      </p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        pending
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentRequirements ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No requirements yet
                </p>
              ) : (
                (recentRequirements ?? []).map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.department}</p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANT[r.status] ?? 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

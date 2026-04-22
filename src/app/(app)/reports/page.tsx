import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Reports' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  TrendingUp,
  DollarSign,
  FileSignature,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(value: number, currency = 'USD') {
  if (value >= 1_000_000)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: string | number
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

// ── Pipeline stage config ──────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'rfp_created', label: 'RFP Created' },
  { key: 'vendors_invited', label: 'Vendors Invited' },
  { key: 'submissions_in', label: 'Submissions In' },
  { key: 'under_evaluation', label: 'Under Evaluation' },
  { key: 'approval_pending', label: 'Approval Pending' },
  { key: 'contracted', label: 'Contracted' },
]

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  terminated: 'Terminated',
}

const CONTRACT_STATUS_COLOR: Record<string, string> = {
  active: 'text-emerald-600 dark:text-emerald-400',
  expiring_soon: 'text-amber-600 dark:text-amber-400',
  expired: 'text-slate-500',
  terminated: 'text-red-600 dark:text-red-400',
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
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

  // All queries in parallel
  const [
    { data: contracts },
    { data: rfps },
    { data: vendorEntries },
    { data: vendorScores },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, title, value, currency, status, end_date, vendor_accounts(company_name), rfps(department)')
      .eq('org_id', orgId)
      .eq('is_deleted', false),
    supabase
      .from('rfps')
      .select('id, status, department, created_at')
      .eq('org_id', orgId)
      .eq('is_deleted', false),
    supabase
      .from('rfp_vendor_entries')
      .select('vendor_account_id, vendor_accounts(company_name)')
      .eq('org_id', orgId),
    supabase
      .from('vendor_scores')
      .select('vendor_account_id, effective_score, vendor_accounts(company_name)')
      .not('effective_score', 'is', null),
  ])

  // ── Spend analytics ──────────────────────────────────────────────────────────

  const activeContracts = (contracts ?? []).filter((c) => c.status === 'active' || c.status === 'expiring_soon')
  const totalSpend = activeContracts.reduce((sum, c) => sum + (c.value ?? 0), 0)
  const totalContractCount = (contracts ?? []).length
  const activeContractCount = activeContracts.length

  // Spend by department
  type DeptSpend = { dept: string; value: number; count: number }
  const deptMap = new Map<string, DeptSpend>()
  for (const c of contracts ?? []) {
    if (c.status !== 'active' && c.status !== 'expiring_soon') continue
    const rfp = (c.rfps as unknown) as { department: string } | null
    const dept = rfp?.department ?? 'Unknown'
    const existing = deptMap.get(dept) ?? { dept, value: 0, count: 0 }
    existing.value += c.value ?? 0
    existing.count += 1
    deptMap.set(dept, existing)
  }
  const deptSpend = Array.from(deptMap.values()).sort((a, b) => b.value - a.value)

  // Contract status breakdown
  const statusBreakdown: Record<string, number> = {}
  for (const c of contracts ?? []) {
    statusBreakdown[c.status] = (statusBreakdown[c.status] ?? 0) + 1
  }

  // Expiring in 90 days
  const now = new Date()
  const in90 = new Date(now)
  in90.setDate(in90.getDate() + 90)
  const expiringContracts = (contracts ?? [])
    .filter((c) => {
      const end = new Date(c.end_date)
      return (c.status === 'active' || c.status === 'expiring_soon') && end > now && end <= in90
    })
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())

  // ── Pipeline funnel ──────────────────────────────────────────────────────────

  const rfpStatusCount: Record<string, number> = {}
  for (const r of rfps ?? []) {
    rfpStatusCount[r.status] = (rfpStatusCount[r.status] ?? 0) + 1
  }
  const totalRfps = (rfps ?? []).length
  const contractedRfps = rfpStatusCount['contracted'] ?? 0
  const conversionRate = totalRfps > 0 ? Math.round((contractedRfps / totalRfps) * 100) : 0

  // ── Vendor performance ───────────────────────────────────────────────────────

  type VendorPerf = { name: string; avg: number; count: number; rfps: number }
  const vendorPerfMap = new Map<string, { name: string; scores: number[]; rfps: number }>()

  // Count RFPs per vendor
  const vendorRfpCount: Record<string, number> = {}
  for (const e of vendorEntries ?? []) {
    vendorRfpCount[e.vendor_account_id] = (vendorRfpCount[e.vendor_account_id] ?? 0) + 1
  }

  for (const s of vendorScores ?? []) {
    if (s.effective_score == null) continue
    const vendor = (s.vendor_accounts as unknown) as { company_name: string } | null
    const name = vendor?.company_name ?? 'Unknown'
    const existing = vendorPerfMap.get(s.vendor_account_id) ?? { name, scores: [], rfps: vendorRfpCount[s.vendor_account_id] ?? 0 }
    existing.scores.push(s.effective_score as number)
    vendorPerfMap.set(s.vendor_account_id, existing)
  }

  const vendorPerf: VendorPerf[] = Array.from(vendorPerfMap.values())
    .map(({ name, scores, rfps }) => ({
      name,
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
      rfps,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10)

  // ── Top vendors by spend ─────────────────────────────────────────────────────

  type VendorSpend = { name: string; value: number; count: number }
  const vendorSpendMap = new Map<string, VendorSpend>()
  for (const c of contracts ?? []) {
    if (c.status !== 'active' && c.status !== 'expiring_soon') continue
    const vendor = (c.vendor_accounts as unknown) as { company_name: string } | null
    const name = vendor?.company_name ?? 'Unknown'
    const existing = vendorSpendMap.get(name) ?? { name, value: 0, count: 0 }
    existing.value += c.value ?? 0
    existing.count += 1
    vendorSpendMap.set(name, existing)
  }
  const topVendors = Array.from(vendorSpendMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Procurement analytics and spend insights
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Spend"
          value={totalSpend > 0 ? fmt(totalSpend) : '—'}
          sub={`across ${activeContractCount} active contract${activeContractCount !== 1 ? 's' : ''}`}
          icon={DollarSign}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Total Contracts"
          value={totalContractCount}
          sub={`${contractedRfps} RFPs contracted`}
          icon={FileSignature}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="RFP Conversion"
          value={`${conversionRate}%`}
          sub={`${contractedRfps} of ${totalRfps} RFPs contracted`}
          icon={TrendingUp}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          title="Expiring in 90 days"
          value={expiringContracts.length}
          sub="contracts need renewal attention"
          icon={Clock}
          accent={
            expiringContracts.length > 0
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
          }
        />
      </div>

      {/* Row 2: Pipeline funnel + Contract health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* RFP Pipeline funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              RFP Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PIPELINE_STAGES.map((stage) => {
              const count = rfpStatusCount[stage.key] ?? 0
              const pct = totalRfps > 0 ? Math.round((count / totalRfps) * 100) : 0
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stage.label}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {totalRfps === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No RFPs yet</p>
            )}
          </CardContent>
        </Card>

        {/* Contract health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-muted-foreground" />
              Contract Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(CONTRACT_STATUS_LABEL).map(([status, label]) => {
              const count = statusBreakdown[status] ?? 0
              const Icon =
                status === 'active'
                  ? CheckCircle2
                  : status === 'expiring_soon'
                    ? AlertTriangle
                    : status === 'terminated'
                      ? XCircle
                      : Clock
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon className={`w-4 h-4 ${CONTRACT_STATUS_COLOR[status]}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${CONTRACT_STATUS_COLOR[status]}`}>
                    {count}
                  </span>
                </div>
              )
            })}
            {totalContractCount === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No contracts yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Spend by department + Top vendors by spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spend by department */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Spend by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deptSpend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No spend data</p>
            ) : (
              <div className="space-y-3">
                {deptSpend.map((d) => {
                  const pct = totalSpend > 0 ? Math.round((d.value / totalSpend) * 100) : 0
                  return (
                    <div key={d.dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[60%]">{d.dept}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {fmt(d.value)} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top vendors by spend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Top Vendors by Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topVendors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No spend data</p>
            ) : (
              <div className="space-y-2.5">
                {topVendors.map((v, i) => (
                  <div key={v.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.count} contract{v.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {fmt(v.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Vendor AI scores + Expiring contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vendor performance scores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Vendor AI Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendorPerf.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No evaluation data yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {vendorPerf.map((v, i) => (
                  <div key={v.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.count} score{v.count !== 1 ? 's' : ''} · {v.rfps} RFP{v.rfps !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500/70"
                          style={{ width: `${(v.avg / 10) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          v.avg >= 7
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : v.avg >= 5
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {v.avg}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring contracts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Expiring Within 90 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contracts expiring soon
              </p>
            ) : (
              <div className="space-y-2.5">
                {expiringContracts.slice(0, 8).map((c) => {
                  const daysLeft = Math.ceil(
                    (new Date(c.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const vendor = (c.vendor_accounts as unknown) as { company_name: string } | null
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {vendor?.company_name ?? '—'}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums shrink-0 ${
                          daysLeft <= 30
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {daysLeft}d left
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

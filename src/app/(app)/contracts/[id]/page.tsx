import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Building2, Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ContractEditForm from './contract-edit-form'

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  expiring_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

interface PageProps {
  params: { id: string }
}

export default async function ContractDetailPage({ params }: PageProps) {
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
  const role = profile.role as string
  if (role !== 'procurement_manager' && role !== 'finance_approver') redirect('/dashboard')

  const { data: contract } = await supabase
    .from('contracts')
    .select(
      'id, title, value, currency, start_date, end_date, payment_terms, alert_days, status, terminated_at, termination_reason, created_at, updated_at, vendor_accounts(company_name, email), rfps(id, title)'
    )
    .eq('id', params.id)
    .eq('org_id', profile.org_id as string)
    .eq('is_deleted', false)
    .single()

  if (!contract) notFound()

  const c = (contract as unknown) as {
    id: string
    title: string
    value: number | null
    currency: string
    start_date: string
    end_date: string
    payment_terms: string | null
    alert_days: number
    status: string
    terminated_at: string | null
    termination_reason: string | null
    created_at: string
    updated_at: string
    vendor_accounts: { company_name: string; email: string } | null
    rfps: { id: string; title: string } | null
  }

  const vendor = (contract.vendor_accounts as unknown) as { company_name: string; email: string } | null
  const rfp = (contract.rfps as unknown) as { id: string; title: string } | null

  const now = new Date()
  const endDate = new Date(c.end_date)
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = c.status === 'active' && daysLeft <= c.alert_days && daysLeft > 0

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to Contracts
      </Link>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="mb-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[c.status] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {c.status.replace(/_/g, ' ')}
                </span>
              </div>
              <CardTitle className="font-heading text-xl">{c.title}</CardTitle>
            </div>
            {role === 'procurement_manager' && (
              <ContractEditForm
                contract={{
                  id: c.id,
                  title: c.title,
                  value: c.value,
                  currency: c.currency,
                  start_date: c.start_date,
                  end_date: c.end_date,
                  payment_terms: c.payment_terms,
                  alert_days: c.alert_days,
                  status: c.status,
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isExpiringSoon && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Expires in <span className="font-semibold">{daysLeft} days</span>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                Vendor
              </div>
              <span className="text-sm font-medium">{vendor?.company_name ?? '—'}</span>
              {vendor?.email && (
                <span className="text-xs text-muted-foreground truncate">{vendor.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                Value
              </div>
              <span className="text-sm font-medium">
                {c.value != null
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: c.currency,
                      maximumFractionDigits: 0,
                    }).format(c.value)
                  : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Start Date
              </div>
              <span className="text-sm font-medium">
                {new Date(c.start_date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                End Date
              </div>
              <span className={`text-sm font-medium ${isExpiringSoon ? 'text-amber-600' : ''}`}>
                {new Date(c.end_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {c.payment_terms && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Payment Terms</p>
              <p className="text-sm">{c.payment_terms}</p>
            </div>
          )}

          {rfp && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Linked RFP:</span>
              <Link href={`/rfps/${rfp.id}`} className="font-medium hover:text-primary transition-colors">
                {rfp.title}
              </Link>
            </div>
          )}

          {c.status === 'terminated' && c.termination_reason && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-1">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Termination Reason</p>
              <p className="text-sm text-red-700 dark:text-red-400">{c.termination_reason}</p>
              {c.terminated_at && (
                <p className="text-xs text-red-600 dark:text-red-500">
                  {new Date(c.terminated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
            <Clock className="w-3 h-3" />
            Updated {new Date(c.updated_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

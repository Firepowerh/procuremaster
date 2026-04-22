import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Contracts' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileSignature, AlertTriangle, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  expiring_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export default async function ContractsPage() {
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

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, value, currency, start_date, end_date, status, vendor_accounts(company_name)')
    .eq('org_id', profile.org_id as string)
    .eq('is_deleted', false)
    .order('end_date', { ascending: true })

  const now = new Date()
  const alertThreshold = new Date()
  alertThreshold.setDate(alertThreshold.getDate() + 90)

  // Auto-flag expiring_soon (in case cron hasn't run)
  const expiringSoon = (contracts ?? []).filter((c) => {
    const end = new Date(c.end_date)
    return c.status === 'active' && end > now && end <= alertThreshold
  })

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Contracts</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Active vendor contracts and renewal tracking
        </p>
      </div>

      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <span className="font-semibold">{expiringSoon.length}</span> contract
            {expiringSoon.length !== 1 ? 's' : ''} expiring within 90 days
          </span>
        </div>
      )}

      {(contracts ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileSignature className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">No contracts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contracts are created automatically when an approval is granted
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(contracts ?? []).map((c) => {
            const vendor = (c.vendor_accounts as unknown) as { company_name: string } | null
            const daysLeft = Math.ceil(
              (new Date(c.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            const isExpiringSoon = c.status === 'active' && daysLeft <= 90 && daysLeft > 0

            return (
              <Link key={c.id} href={`/contracts/${c.id}`} className="block group">
                <Card className={`transition-colors group-hover:border-primary/50 ${isExpiringSoon ? 'border-amber-300 dark:border-amber-700' : ''}`}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {c.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {vendor && <span>{vendor.company_name}</span>}
                          {c.value != null && (
                            <>
                              <span>·</span>
                              <span>
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: c.currency ?? 'USD',
                                  maximumFractionDigits: 0,
                                }).format(c.value)}
                              </span>
                            </>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(c.start_date).toLocaleDateString()} –{' '}
                            {new Date(c.end_date).toLocaleDateString()}
                          </span>
                          {isExpiringSoon && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 font-medium">
                                {daysLeft}d left
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[c.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {c.status.replace(/_/g, ' ')}
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

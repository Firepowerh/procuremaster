import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'RFPs' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RfpFilters from './rfp-filters'

const STATUS_CLASS: Record<string, string> = {
  requirements_received:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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
  searchParams: { status?: string; q?: string }
}

export default async function RfpsPage({ searchParams }: PageProps) {
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
    .from('rfps')
    .select(
      'id, title, department, status, submission_deadline, created_at, budget_min, budget_max'
    )
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }

  const { data: rfps } = await query.limit(50)

  // Vendor counts per RFP
  let vendorCounts: Record<string, number> = {}
  if ((rfps ?? []).length > 0) {
    const ids = (rfps ?? []).map((r) => r.id)
    const { data: counts } = await supabase
      .from('rfp_vendor_entries')
      .select('rfp_id')
      .in('rfp_id', ids)
    if (counts) {
      for (const c of counts) {
        vendorCounts[c.rfp_id] = (vendorCounts[c.rfp_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">RFPs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage requests for proposals across your organisation
          </p>
        </div>
        {role === 'procurement_manager' && (
          <Button size="sm" render={<Link href="/rfps/new" />}>
            <Plus className="w-4 h-4 mr-1.5" />
            New RFP
          </Button>
        )}
      </div>

      <RfpFilters currentStatus={searchParams.status ?? 'all'} currentQ={searchParams.q ?? ''} />

      {(rfps ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-sm">No RFPs found.</p>
          {role === 'procurement_manager' && (
            <Button variant="link" className="mt-2 text-sm" render={<Link href="/rfps/new" />}>
              Create your first RFP
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(rfps ?? []).map((rfp) => (
            <Link key={rfp.id} href={`/rfps/${rfp.id}`} className="block group">
              <Card className="transition-colors group-hover:border-primary/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {rfp.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>{rfp.department}</span>
                        {rfp.submission_deadline && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(rfp.submission_deadline).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        {(vendorCounts[rfp.id] ?? 0) > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {vendorCounts[rfp.id]} vendor
                              {vendorCounts[rfp.id] !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                        {(rfp.budget_min != null || rfp.budget_max != null) && (
                          <>
                            <span>·</span>
                            <span>
                              {rfp.budget_min != null && rfp.budget_max != null
                                ? `$${(rfp.budget_min / 1000).toFixed(0)}k–$${(rfp.budget_max / 1000).toFixed(0)}k`
                                : rfp.budget_max != null
                                  ? `up to $${(rfp.budget_max / 1000).toFixed(0)}k`
                                  : `from $${(rfp.budget_min! / 1000).toFixed(0)}k`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[rfp.status] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {rfp.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

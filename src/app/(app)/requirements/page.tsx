import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Requirements' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import RequirementsFilters from './requirements-filters'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RequirementRow = {
  id: string
  title: string
  description: string
  department: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'draft' | 'submitted' | 'in_progress' | 'vendor_selected' | 'closed'
  budget_estimate: number | null
  required_by: string | null
  created_at: string
  raised_by: string
  profiles: { full_name: string } | null
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: {
    status?: string
    priority?: string
    q?: string
  }
}

export default async function RequirementsPage({ searchParams }: PageProps) {
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

  // Build query
  let query = supabase
    .from('requirements')
    .select('id, title, description, department, priority, status, budget_estimate, required_by, created_at, raised_by, profiles(full_name)')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  // Department heads only see their own
  if (role === 'department_head') {
    query = query.eq('raised_by', user.id)
  }

  // Filters
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.priority && searchParams.priority !== 'all') {
    query = query.eq('priority', searchParams.priority)
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }

  const { data: requirements } = await query.limit(50)

  const canCreate = role === 'procurement_manager' || role === 'department_head'

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">Requirements</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === 'department_head'
              ? 'Manage your department procurement requests'
              : 'All procurement requirements across departments'}
          </p>
        </div>
        {canCreate && (
          <Button size="sm" render={<Link href="/requirements/new" />}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Requirement
          </Button>
        )}
      </div>

      {/* Filters */}
      <RequirementsFilters
        currentStatus={searchParams.status ?? 'all'}
        currentPriority={searchParams.priority ?? 'all'}
        currentQ={searchParams.q ?? ''}
      />

      {/* List */}
      {(requirements ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-sm">No requirements found.</p>
          {canCreate && (
            <Button variant="link" className="mt-2 text-sm" render={<Link href="/requirements/new" />}>
              Create your first requirement
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(requirements as unknown as RequirementRow[]).map((r) => (
            <Link key={r.id} href={`/requirements/${r.id}`} className="block group">
              <Card className="transition-colors group-hover:border-primary/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {r.title}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CLASS[r.priority]}`}
                        >
                          {r.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {r.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{r.department}</span>
                        {r.profiles?.full_name && (
                          <>
                            <span>·</span>
                            <span>{r.profiles.full_name}</span>
                          </>
                        )}
                        {r.required_by && (
                          <>
                            <span>·</span>
                            <span>Due {new Date(r.required_by).toLocaleDateString()}</span>
                          </>
                        )}
                        {r.budget_estimate != null && (
                          <>
                            <span>·</span>
                            <span>
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0,
                              }).format(r.budget_estimate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[r.status]}`}
                    >
                      {r.status.replace(/_/g, ' ')}
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

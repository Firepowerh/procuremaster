import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/auth-store'

interface ProcurementManagerStats {
  activeRfps: number
  pendingEvaluations: number
  openRequirements: number
}

interface DepartmentHeadStats {
  myRequirements: number
  activeRfps: number
}

interface FinanceApproverStats {
  pendingApprovals: number
  activeContracts: number
}

interface VendorStats {
  mySubmissions: number
}

export type DashboardStats =
  | { role: 'procurement_manager'; data: ProcurementManagerStats }
  | { role: 'department_head'; data: DepartmentHeadStats }
  | { role: 'finance_approver'; data: FinanceApproverStats }
  | { role: 'vendor'; data: VendorStats }
  | null

export function useDashboardStats() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchStats()
  }, [profile?.role, profile?.org_id])

  async function fetchStats() {
    setLoading(true)
    setError(null)

    try {
      if (profile?.role === 'procurement_manager') {
        const [rfpRes, evalRes, reqRes] = await Promise.all([
          supabase
            .from('rfps')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .not('status', 'eq', 'contracts_signed'),
          supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .in('evaluation_status', ['criteria_pending', 'scoring_in_progress']),
          supabase
            .from('requirements')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .in('status', ['submitted', 'approved']),
        ])
        setStats({
          role: 'procurement_manager',
          data: {
            activeRfps: rfpRes.count ?? 0,
            pendingEvaluations: evalRes.count ?? 0,
            openRequirements: reqRes.count ?? 0,
          },
        })
      } else if (profile?.role === 'department_head') {
        const [myReqRes, rfpRes] = await Promise.all([
          supabase
            .from('requirements')
            .select('id', { count: 'exact', head: true })
            .eq('raised_by', profile.id),
          supabase
            .from('rfps')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .not('status', 'eq', 'contracts_signed'),
        ])
        setStats({
          role: 'department_head',
          data: {
            myRequirements: myReqRes.count ?? 0,
            activeRfps: rfpRes.count ?? 0,
          },
        })
      } else if (profile?.role === 'finance_approver') {
        const [approvalRes, contractRes] = await Promise.all([
          supabase
            .from('approval_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('contracts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),
        ])
        setStats({
          role: 'finance_approver',
          data: {
            pendingApprovals: approvalRes.count ?? 0,
            activeContracts: contractRes.count ?? 0,
          },
        })
      } else if (profile?.role === 'vendor') {
        const vendorRes = await supabase
          .from('vendor_accounts')
          .select('id')
          .eq('auth_user_id', profile.id)
          .single()

        const count = vendorRes.data
          ? (await supabase
              .from('rfp_vendor_entries')
              .select('id', { count: 'exact', head: true })
              .eq('vendor_account_id', vendorRes.data.id)).count ?? 0
          : 0

        setStats({ role: 'vendor', data: { mySubmissions: count } })
      }
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, error, refetch: fetchStats }
}

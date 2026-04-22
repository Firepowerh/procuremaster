import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Vendors' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, Mail, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CreateVendorDialog from './create-vendor-dialog'

export default async function VendorsPage() {
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

  const { data: vendors } = await supabase
    .from('vendor_accounts')
    .select('id, company_name, contact_name, email, is_active, created_at')
    .eq('org_id', profile.org_id as string)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  // RFP count per vendor
  const vendorIds = (vendors ?? []).map((v) => v.id)
  let rfpCounts: Record<string, number> = {}
  if (vendorIds.length > 0) {
    const { data: entries } = await supabase
      .from('rfp_vendor_entries')
      .select('vendor_account_id')
      .in('vendor_account_id', vendorIds)
    if (entries) {
      for (const e of entries) {
        rfpCounts[e.vendor_account_id] = (rfpCounts[e.vendor_account_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">Vendors</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All vendor accounts registered with your organisation
          </p>
        </div>
        <CreateVendorDialog />
      </div>

      {(vendors ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No vendors yet. Invite vendors from an RFP to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {(vendors ?? []).map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  {v.is_active ? (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </div>
                  )}
                </div>
                <CardTitle className="text-sm font-semibold mt-2">{v.company_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{v.contact_name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{v.email}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  {rfpCounts[v.id] ?? 0} RFP{(rfpCounts[v.id] ?? 0) !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

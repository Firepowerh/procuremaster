import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Settings' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { User, Building2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ProfileForm, OrgForm } from './settings-forms'

const ROLE_LABEL: Record<string, string> = {
  procurement_manager: 'Procurement Manager',
  finance_approver: 'Finance Approver',
  department_head: 'Department Head',
  vendor: 'Vendor',
}

export default async function SettingsPage() {
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

  const { data: org } = await supabase
    .from('organisations')
    .select('name, slug, currency')
    .eq('id', profile.org_id as string)
    .single()

  const isManager = profile.role === 'procurement_manager'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your profile and organisation preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription className="text-xs">Your personal account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={profile.full_name as string}
            role={ROLE_LABEL[profile.role as string] ?? (profile.role as string)}
            email={user.email ?? ''}
          />
        </CardContent>
      </Card>

      {/* Organisation — PM only */}
      {isManager && org && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Organisation</CardTitle>
                <CardDescription className="text-xs">
                  Visible to all members of your organisation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <OrgForm
              orgName={org.name as string}
              orgSlug={org.slug as string}
              currency={(org.currency as string) ?? 'USD'}
            />
          </CardContent>
        </Card>
      )}

      {/* Role info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Access & Permissions</CardTitle>
              <CardDescription className="text-xs">Your role and what you can access</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium">
              {ROLE_LABEL[profile.role as string] ?? profile.role}
            </span>
          </div>
          {profile.role === 'procurement_manager' && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>· Manage requirements, RFPs, evaluations, and contracts</li>
              <li>· Invite vendors and review submissions</li>
              <li>· View reports and analytics</li>
              <li>· Manage organisation settings</li>
            </ul>
          )}
          {profile.role === 'finance_approver' && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>· Review and approve or reject procurement requests</li>
              <li>· View contracts and evaluations</li>
            </ul>
          )}
          {profile.role === 'department_head' && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>· Submit and manage departmental requirements</li>
              <li>· Track RFPs linked to your requirements</li>
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground pt-1">
            To change your role, contact your Procurement Manager.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

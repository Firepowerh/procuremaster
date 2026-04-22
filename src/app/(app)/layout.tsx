import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'
import Topbar from '@/components/layout/topbar'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'procurement_manager' && !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={profile.role as string} fullName={profile.full_name as string} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          userId={user.id}
          fullName={profile.full_name as string}
          role={profile.role as string}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <main id="main-content" className="flex-1 overflow-y-auto p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}

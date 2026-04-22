'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Building2,
  BarChart3,
  CheckSquare,
  FileSignature,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ── Nav definition ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['procurement_manager', 'department_head', 'finance_approver'],
  },
  {
    href: '/requirements',
    label: 'Requirements',
    icon: FileText,
    roles: ['procurement_manager', 'department_head'],
  },
  {
    href: '/rfps',
    label: 'RFPs',
    icon: ClipboardList,
    roles: ['procurement_manager', 'department_head', 'finance_approver'],
  },
  {
    href: '/vendors',
    label: 'Vendors',
    icon: Building2,
    roles: ['procurement_manager'],
  },
  {
    href: '/evaluations',
    label: 'Evaluations',
    icon: BarChart3,
    roles: ['procurement_manager'],
  },
  {
    href: '/approvals',
    label: 'Approvals',
    icon: CheckSquare,
    roles: ['procurement_manager', 'department_head', 'finance_approver'],
  },
  {
    href: '/contracts',
    label: 'Contracts',
    icon: FileSignature,
    roles: ['procurement_manager', 'finance_approver'],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: TrendingUp,
    roles: ['procurement_manager'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['procurement_manager', 'department_head', 'finance_approver'],
  },
] as const

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  role: string
  fullName: string
}

export default function Sidebar({ role, fullName }: Props) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  const visibleItems = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(role)
  )

  // Initials for the bottom avatar
  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const roleLabel = role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-card border-r shrink-0 transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-2.5 h-14 px-4 border-b shrink-0',
          sidebarCollapsed && 'justify-center px-0'
        )}
      >
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4 text-primary-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.04 12c.065 4.028 1.892 7.635 4.713 10.077A11.952 11.952 0 0012 24c3.059 0 5.842-1.154 7.961-3.049A11.959 11.959 0 0023.96 12c-.065-4.028-1.892-7.635-4.713-10.077A11.952 11.952 0 0012 2c-.898 0-1.774.107-2.613.31z"
            />
          </svg>
        </div>
        {!sidebarCollapsed && (
          <span className="font-heading text-sm font-semibold leading-none">
            ProcureMaster
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          const linkClass = cn(
            'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            sidebarCollapsed && 'justify-center px-0 w-10 mx-auto'
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={<Link href={item.href} className={linkClass} />}>
                  <Icon className="w-4 h-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link key={item.href} href={item.href} className={linkClass}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div
        className={cn(
          'flex items-center gap-2.5 p-3 border-t',
          sidebarCollapsed && 'justify-center'
        )}
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
          {initials}
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate leading-tight">{roleLabel}</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-background border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  )
}

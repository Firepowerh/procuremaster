'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateVendorStatusAction } from './actions'

const PIPELINE_STATUSES = [
  'invited',
  'submitted',
  'under_review',
  'shortlisted',
  'approved',
  'not_selected',
  'contracted',
] as const

const STATUS_CLASS: Record<string, string> = {
  invited: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  under_review: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  shortlisted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  not_selected: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  contracted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

interface VendorEntry {
  id: string
  status: string
  vendor_accounts: { company_name: string; email: string } | null
}

interface Props {
  rfpId: string
  entries: VendorEntry[]
  isManager: boolean
}

export default function VendorPipeline({ rfpId, entries, isManager }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null)

  const handleStatus = async (entryId: string, status: string) => {
    setPendingId(entryId)
    const result = await updateVendorStatusAction(entryId, rfpId, status)
    setPendingId(null)
    if (result.error) toast.error(result.error)
    else toast.success('Status updated')
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No vendors invited yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border bg-card"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {entry.vendor_accounts?.company_name ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {entry.vendor_accounts?.email ?? ''}
            </p>
          </div>

          {isManager ? (
            <div className="relative shrink-0">
              <select
                value={entry.status}
                disabled={pendingId === entry.id}
                onChange={(e) => handleStatus(entry.id, e.target.value)}
                className={`appearance-none text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 pr-5 cursor-pointer border-0 outline-none ${STATUS_CLASS[entry.status] ?? 'bg-muted text-muted-foreground'}`}
              >
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none opacity-60" />
            </div>
          ) : (
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[entry.status] ?? 'bg-muted text-muted-foreground'}`}
            >
              {entry.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

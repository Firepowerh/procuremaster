'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const STATUSES = [
  'all',
  'requirements_received',
  'rfp_created',
  'vendors_invited',
  'submissions_in',
  'under_evaluation',
  'shortlisted',
  'approval_pending',
  'contracted',
  'archived',
]

interface Props {
  currentStatus: string
  currentQ: string
}

export default function RfpFilters({ currentStatus, currentQ }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === 'all') {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const hasFilters = (currentStatus && currentStatus !== 'all') || !!currentQ

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          defaultValue={currentQ}
          placeholder="Search RFPs..."
          className="pl-8 h-8 text-sm"
          onChange={(e) => {
            const val = e.target.value
            setTimeout(() => updateParams({ q: val }), 300)
          }}
        />
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateParams({ status: s })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              currentStatus === s || (s === 'all' && !currentStatus)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => router.push(pathname)}
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

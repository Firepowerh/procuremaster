'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const STATUSES = ['all', 'draft', 'submitted', 'in_progress', 'vendor_selected', 'closed']
const PRIORITIES = ['all', 'low', 'medium', 'high', 'critical']

interface Props {
  currentStatus: string
  currentPriority: string
  currentQ: string
}

export default function RequirementsFilters({ currentStatus, currentPriority, currentQ }: Props) {
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

  const hasFilters =
    (currentStatus && currentStatus !== 'all') ||
    (currentPriority && currentPriority !== 'all') ||
    !!currentQ

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          defaultValue={currentQ}
          placeholder="Search requirements..."
          className="pl-8 h-8 text-sm"
          onChange={(e) => {
            const val = e.target.value
            const timeout = setTimeout(() => updateParams({ q: val }), 300)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status pills */}
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
              {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Priority pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => updateParams({ priority: p })}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                currentPriority === p || (p === 'all' && !currentPriority)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p === 'all' ? 'All priorities' : p}
            </button>
          ))}
        </div>

        {/* Clear */}
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

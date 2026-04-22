'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateRfpStatusAction } from './actions'

const TRANSITIONS: Record<string, { label: string; next: string; variant?: 'outline' | 'default' }[]> = {
  rfp_created: [{ label: 'Invite Vendors', next: 'vendors_invited' }],
  vendors_invited: [{ label: 'Mark Submissions In', next: 'submissions_in' }],
  submissions_in: [{ label: 'Start Evaluation', next: 'under_evaluation' }],
  under_evaluation: [{ label: 'Shortlist Vendors', next: 'shortlisted' }],
  shortlisted: [{ label: 'Send for Approval', next: 'approval_pending' }],
  approval_pending: [],
  contracted: [{ label: 'Archive', next: 'archived', variant: 'outline' }],
  archived: [],
}

interface Props {
  rfpId: string
  currentStatus: string
}

export default function RfpStatusActions({ rfpId, currentStatus }: Props) {
  const [pending, setPending] = useState<string | null>(null)

  const transitions = TRANSITIONS[currentStatus] ?? []
  if (transitions.length === 0) return null

  const handle = async (next: string) => {
    setPending(next)
    const result = await updateRfpStatusAction(rfpId, next)
    setPending(null)
    if (result.error) toast.error(result.error)
    else toast.success('RFP status updated')
  }

  return (
    <div className="flex items-center gap-2">
      {transitions.map((t) => (
        <Button
          key={t.next}
          size="sm"
          variant={t.variant ?? 'default'}
          onClick={() => handle(t.next)}
          disabled={!!pending}
        >
          {pending === t.next ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
          {t.label}
        </Button>
      ))}
    </div>
  )
}

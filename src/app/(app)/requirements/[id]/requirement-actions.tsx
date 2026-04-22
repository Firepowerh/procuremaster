'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateRequirementStatusAction, deleteRequirementAction } from './actions'

interface Props {
  requirementId: string
  currentStatus: string
  role: string
  isOwner: boolean
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: 'Submit for Review', next: 'submitted' }],
  submitted: [{ label: 'Mark In Progress', next: 'in_progress' }],
  in_progress: [
    { label: 'Vendor Selected', next: 'vendor_selected' },
    { label: 'Close', next: 'closed' },
  ],
  vendor_selected: [{ label: 'Close', next: 'closed' }],
  closed: [],
}

const PM_STATUSES = ['submitted', 'in_progress', 'vendor_selected', 'closed']

export default function RequirementActions({ requirementId, currentStatus, role, isOwner }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? []

  // Filter by role
  const allowedTransitions = transitions.filter((t) => {
    if (role === 'procurement_manager') return PM_STATUSES.includes(t.next) || t.next === 'submitted'
    if (role === 'department_head') return t.next === 'submitted' && isOwner
    return false
  })

  const handleStatus = async (next: string) => {
    setPending(next)
    const result = await updateRequirementStatusAction(requirementId, next)
    setPending(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Status updated')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this requirement? This cannot be undone.')) return
    setPending('delete')
    const result = await deleteRequirementAction(requirementId)
    setPending(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Requirement deleted')
      router.push('/requirements')
    }
  }

  const canDelete =
    role === 'procurement_manager' ||
    (role === 'department_head' && isOwner && currentStatus === 'draft')

  if (allowedTransitions.length === 0 && !canDelete) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {allowedTransitions.map((t) => (
        <Button
          key={t.next}
          size="sm"
          onClick={() => handleStatus(t.next)}
          disabled={!!pending}
        >
          {pending === t.next ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
          {t.label}
        </Button>
      ))}
      {canDelete && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={!!pending}
        >
          {pending === 'delete' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          )}
          Delete
        </Button>
      )}
    </div>
  )
}

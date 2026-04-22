'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { decideApprovalAction, recallApprovalAction } from './actions'

interface Props {
  approvalId: string
  role: string
}

export default function ApprovalActions({ approvalId, role }: Props) {
  const [pending, setPending] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('other')

  const handleApprove = async () => {
    setPending('approve')
    const result = await decideApprovalAction(approvalId, 'approved', comment || undefined)
    setPending(null)
    if (result.error) toast.error(result.error)
    else toast.success('Approved')
  }

  const handleReject = async () => {
    setPending('reject')
    const result = await decideApprovalAction(approvalId, 'rejected', comment || undefined, reason)
    setPending(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Rejected')
      setShowReject(false)
    }
  }

  const handleRecall = async () => {
    setPending('recall')
    const result = await recallApprovalAction(approvalId)
    setPending(null)
    if (result.error) toast.error(result.error)
    else toast.success('Recalled')
  }

  if (showReject) {
    return (
      <div className="space-y-2 min-w-[260px]">
        <Select value={reason} onValueChange={(v) => v && setReason(v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="budget_concerns">Budget concerns</SelectItem>
            <SelectItem value="compliance_risk">Compliance risk</SelectItem>
            <SelectItem value="insufficient_information">Insufficient information</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment..."
          rows={2}
          className="text-xs resize-none"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={handleReject} disabled={!!pending}>
            {pending === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Confirm Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {(role === 'finance_approver' || role === 'procurement_manager') && (
        <>
          <Button size="sm" onClick={handleApprove} disabled={!!pending}>
            {pending === 'approve' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowReject(true)}
            disabled={!!pending}
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Reject
          </Button>
        </>
      )}
      {role === 'procurement_manager' && (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleRecall}
          disabled={!!pending}
        >
          {pending === 'recall' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          )}
          Recall
        </Button>
      )}
    </div>
  )
}

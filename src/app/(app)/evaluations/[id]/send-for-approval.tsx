'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sendForApprovalAction } from '../actions'

interface Vendor {
  id: string
  company_name: string
}

interface Approver {
  id: string
  full_name: string
}

interface Props {
  evaluationId: string
  vendors: Vendor[]
  approvers: Approver[]
}

export default function SendForApproval({ evaluationId, vendors, approvers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [approverId, setApproverId] = useState('')
  const [slaDays, setSlaDays] = useState('5')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async () => {
    if (!vendorId) return toast.error('Select a vendor')
    if (!approverId) return toast.error('Select an approver')
    const days = parseInt(slaDays)
    if (isNaN(days) || days < 1) return toast.error('SLA must be at least 1 day')

    setIsPending(true)
    const result = await sendForApprovalAction(evaluationId, vendorId, approverId, days)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Sent for approval')
      setOpen(false)
      router.push('/approvals')
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} disabled={vendors.length === 0 || approvers.length === 0}>
        <Send className="w-3.5 h-3.5 mr-1.5" />
        Send for Approval
      </Button>
    )
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium">Send for Approval</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Vendor</Label>
          <Select onValueChange={(v) => { const s = v as string | null; if (s) setVendorId(s) }}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select vendor..." />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Finance Approver</Label>
          <Select onValueChange={(v) => { const s = v as string | null; if (s) setApproverId(s) }}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select approver..." />
            </SelectTrigger>
            <SelectContent>
              {approvers.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">SLA (days)</Label>
          <Input
            type="number"
            min="1"
            max="30"
            value={slaDays}
            onChange={(e) => setSlaDays(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

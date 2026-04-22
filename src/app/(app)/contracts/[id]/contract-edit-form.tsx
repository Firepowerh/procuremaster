'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateContractAction, terminateContractAction } from './actions'
import { useRouter } from 'next/navigation'

interface Contract {
  id: string
  title: string
  value: number | null
  currency: string
  start_date: string
  end_date: string
  payment_terms: string | null
  alert_days: number
  status: string
}

interface Props {
  contract: Contract
}

export default function ContractEditForm({ contract }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [terminating, setTerminating] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)
  const [terminationReason, setTerminationReason] = useState('')

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const result = await updateContractAction(contract.id, fd)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Contract updated')
      setEditing(false)
    }
  }

  const handleTerminate = async () => {
    if (!terminationReason.trim()) return toast.error('Reason is required')
    setTerminating(true)
    const result = await terminateContractAction(contract.id, terminationReason)
    setTerminating(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Contract terminated')
      router.push('/contracts')
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {contract.status === 'active' && (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowTerminate(true)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Terminate
            </Button>
          </>
        )}
        {showTerminate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl border p-6 w-full max-w-sm space-y-4 shadow-xl">
              <h3 className="font-heading text-base font-semibold">Terminate Contract</h3>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Please provide a reason.
              </p>
              <Textarea
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                placeholder="Termination reason..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleTerminate}
                  disabled={terminating}
                  className="flex-1"
                >
                  {terminating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Confirm Termination
                </Button>
                <Button variant="outline" onClick={() => setShowTerminate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 pt-2 border-t">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title" className="text-xs">Title</Label>
          <Input id="title" name="title" defaultValue={contract.title} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="value" className="text-xs">Value</Label>
          <Input id="value" name="value" type="number" defaultValue={contract.value ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency" className="text-xs">Currency</Label>
          <Input id="currency" name="currency" defaultValue={contract.currency} maxLength={3} className="uppercase" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start_date" className="text-xs">Start Date</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={contract.start_date} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date" className="text-xs">End Date</Label>
          <Input id="end_date" name="end_date" type="date" defaultValue={contract.end_date} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alert_days" className="text-xs">Alert Days Before Expiry</Label>
          <Input id="alert_days" name="alert_days" type="number" min="1" defaultValue={contract.alert_days} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="payment_terms" className="text-xs">Payment Terms</Label>
          <Textarea id="payment_terms" name="payment_terms" defaultValue={contract.payment_terms ?? ''} rows={2} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Save Changes
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

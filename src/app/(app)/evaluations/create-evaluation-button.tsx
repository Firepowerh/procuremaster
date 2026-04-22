'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEvaluationAction } from './actions'

interface Props {
  eligibleRfps: { id: string; title: string; department: string }[]
  orgId: string
}

export default function CreateEvaluationButton({ eligibleRfps }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedRfp, setSelectedRfp] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleCreate = async () => {
    if (!selectedRfp) return toast.error('Select an RFP')
    setIsPending(true)
    const result = await createEvaluationAction(selectedRfp)
    setIsPending(false)
    if (result.error) {
      toast.error(result.error)
    } else if (result.id) {
      toast.success('Evaluation created')
      router.push(`/evaluations/${result.id}`)
    }
  }

  if (!showForm) {
    return (
      <Button size="sm" onClick={() => setShowForm(true)}>
        <Plus className="w-4 h-4 mr-1.5" />
        New Evaluation
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={(v) => { const s = v as string | null; if (s) setSelectedRfp(s) }}>
        <SelectTrigger className="h-8 text-sm w-64">
          <SelectValue placeholder="Select RFP..." />
        </SelectTrigger>
        <SelectContent>
          {eligibleRfps.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleCreate} disabled={isPending || !selectedRfp}>
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
        Create
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
        Cancel
      </Button>
    </div>
  )
}

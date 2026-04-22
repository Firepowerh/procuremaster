'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createRfpAction } from './actions'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  submission_deadline: z.string().optional(),
  requirement_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface RequirementOption {
  id: string
  title: string
  department: string
}

interface Props {
  requirements: RequirementOption[]
}

export default function CreateRfpForm({ requirements }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (data) => {
    setIsPending(true)
    const fd = new FormData()
    for (const [k, v] of Object.entries(data)) {
      if (v) fd.append(k, v)
    }

    const result = await createRfpAction(null, fd)
    setIsPending(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }
    if (result?.errors) {
      const first = Object.values(result.errors)[0]?.[0]
      if (first) toast.error(first)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="e.g. Cloud Infrastructure RFP Q3 2026" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Scope & Requirements *</Label>
        <Textarea
          id="description"
          placeholder="Describe the project scope, technical requirements, evaluation criteria..."
          rows={5}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="department">Department *</Label>
          <Input id="department" placeholder="e.g. IT, Finance" {...register('department')} />
          {errors.department && (
            <p className="text-xs text-destructive">{errors.department.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="submission_deadline">Submission Deadline</Label>
          <Input id="submission_deadline" type="datetime-local" {...register('submission_deadline')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget_min">Budget Min (USD)</Label>
          <Input id="budget_min" type="number" min="0" step="1000" placeholder="e.g. 20000" {...register('budget_min')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget_max">Budget Max (USD)</Label>
          <Input id="budget_max" type="number" min="0" step="1000" placeholder="e.g. 100000" {...register('budget_max')} />
        </div>
      </div>

      {requirements.length > 0 && (
        <div className="space-y-1.5">
          <Label>Link to Requirement (optional)</Label>
          <Select onValueChange={(v) => { const s = v as string | null; if (s) setValue('requirement_id', s === 'none' ? '' : s) }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a requirement..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {requirements.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.title} — {r.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="min-w-[100px]">
          {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Create RFP
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

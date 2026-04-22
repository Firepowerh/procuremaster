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
import { createRequirementAction } from './actions'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  budget_estimate: z.string().optional(),
  required_by: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  defaultDepartment?: string
}

export default function CreateRequirementForm({ defaultDepartment }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [submitType, setSubmitType] = useState<'draft' | 'submitted'>('draft')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      department: defaultDepartment ?? '',
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    setIsPending(true)
    const fd = new FormData()
    for (const [k, v] of Object.entries(data)) {
      if (v) fd.append(k, v)
    }
    fd.append('submit', submitType)

    const result = await createRequirementAction(null, fd)
    setIsPending(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }
    if (result?.errors) {
      const first = Object.values(result.errors)[0]?.[0]
      if (first) toast.error(first)
      return
    }
    // redirect happens server-side on success
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Cloud Storage Solution for Finance Dept"
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the procurement need, expected outcomes, and any specific requirements..."
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Department + Priority row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            placeholder="e.g. Finance, IT, Operations"
            {...register('department')}
          />
          {errors.department && (
            <p className="text-xs text-destructive">{errors.department.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Priority *</Label>
          <Select
            defaultValue="medium"
            onValueChange={(v) => setValue('priority', v as FormValues['priority'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget + Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget_estimate">Budget Estimate (USD)</Label>
          <Input
            id="budget_estimate"
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 50000"
            {...register('budget_estimate')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="required_by">Required By</Label>
          <Input id="required_by" type="date" {...register('required_by')} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          onClick={() => setSubmitType('submitted')}
          className="min-w-[120px]"
        >
          {isPending && submitType === 'submitted' ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Submit
        </Button>
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          onClick={() => setSubmitType('draft')}
        >
          {isPending && submitType === 'draft' ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save as Draft
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

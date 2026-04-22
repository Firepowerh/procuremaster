'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { createVendorAction } from './actions'

export default function CreateVendorDialog() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const result = await createVendorAction(formData)

    setPending(false)

    if (result?.errors) {
      setErrors(result.errors)
      return
    }
    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success('Vendor created successfully')
    setOpen(false)
    formRef.current?.reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="default" size="sm" />}>
        <Plus className="w-4 h-4 mr-1.5" />
        Add Vendor
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogTitle>Add Vendor</DialogTitle>
        <DialogDescription>
          Create a new vendor account. You can invite them to RFPs from the RFP detail page.
        </DialogDescription>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Acme Corp"
              disabled={pending}
              aria-invalid={!!errors.company_name}
            />
            {errors.company_name && (
              <p className="text-xs text-destructive">{errors.company_name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              placeholder="Jane Smith"
              disabled={pending}
              aria-invalid={!!errors.contact_name}
            />
            {errors.contact_name && (
              <p className="text-xs text-destructive">{errors.contact_name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@acme.com"
              disabled={pending}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email[0]}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Create Vendor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteVendorToRfpAction } from './actions'

interface Props {
  rfpId: string
}

export default function InviteVendorForm({ rfpId }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const fd = new FormData(e.currentTarget)
    const result = await inviteVendorToRfpAction(rfpId, fd)
    setIsPending(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Vendor invited')
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        Invite Vendor
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
      <div className="space-y-1">
        <Label htmlFor="company_name" className="text-xs">Company</Label>
        <Input id="company_name" name="company_name" placeholder="Acme Corp" className="h-8 text-sm w-32" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact_name" className="text-xs">Contact Name</Label>
        <Input id="contact_name" name="contact_name" placeholder="Jane Smith" className="h-8 text-sm w-32" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs">Email</Label>
        <Input id="email" name="email" type="email" placeholder="vendor@example.com" className="h-8 text-sm w-44" required />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
        Send Invite
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  )
}

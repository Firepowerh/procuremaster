'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfileAction, updateOrgAction } from './actions'

interface ProfileFormProps {
  fullName: string
  role: string
  email: string
}

export function ProfileForm({ fullName, role, email }: ProfileFormProps) {
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateProfileAction(new FormData(e.currentTarget))
    setSaving(false)
    if (result.error) toast.error(result.error)
    else toast.success('Profile updated')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs">Full Name</Label>
          <Input id="full_name" name="full_name" defaultValue={fullName} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={email} disabled className="bg-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Input value={role.replace(/_/g, ' ')} disabled className="bg-muted/50 capitalize" />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
        Save Profile
      </Button>
    </form>
  )
}

interface OrgFormProps {
  orgName: string
  orgSlug: string
  currency: string
}

export function OrgForm({ orgName, orgSlug, currency }: OrgFormProps) {
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateOrgAction(new FormData(e.currentTarget))
    setSaving(false)
    if (result.error) toast.error(result.error)
    else toast.success('Organisation updated')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs">Organisation Name</Label>
          <Input id="name" name="name" defaultValue={orgName} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Slug</Label>
          <Input value={orgSlug} disabled className="bg-muted/50 font-mono text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency" className="text-xs">Default Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={currency}
            maxLength={3}
            className="uppercase w-24"
          />
          <p className="text-[11px] text-muted-foreground">3-letter ISO code (e.g. USD, EUR, GBP)</p>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
        Save Organisation
      </Button>
    </form>
  )
}

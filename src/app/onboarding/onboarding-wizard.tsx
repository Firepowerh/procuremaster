'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateOrgAction, inviteTeamMemberAction, completeOnboardingAction } from './actions'
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

// ── Schemas ────────────────────────────────────────────────────────────────────

const orgSchema = z.object({
  orgName: z.string().min(2, 'Organisation name is required'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AUD', 'CAD']),
})

const inviteSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['department_head', 'finance_approver']),
})

type OrgInput = z.infer<typeof orgSchema>
type InviteInput = z.infer<typeof inviteSchema>

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
]

const ROLES = [
  { value: 'department_head', label: 'Department Head' },
  { value: 'finance_approver', label: 'Finance Approver' },
]

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              i + 1 < current
                ? 'bg-primary text-primary-foreground'
                : i + 1 === current
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1 < current ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="w-3.5 h-3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i + 1 < current ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Organisation details ───────────────────────────────────────────────

function StepOrg({
  orgName,
  currency,
  onNext,
}: {
  orgName: string
  currency: string
  onNext: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrgInput>({
    resolver: zodResolver(orgSchema),
    defaultValues: { orgName, currency: (currency as OrgInput['currency']) ?? 'USD' },
  })

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null)
    setIsPending(true)
    const fd = new FormData()
    fd.set('orgName', data.orgName)
    fd.set('currency', data.currency)
    const result = await updateOrgAction(fd)
    setIsPending(false)
    if (result.error) { setServerError(result.error); return }
    onNext()
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">Your organisation</h2>
        <p className="text-sm text-muted-foreground">
          Confirm your organisation name and default currency
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organisation name</Label>
          <Input id="orgName" {...register('orgName')} />
          {errors.orgName && (
            <p className="text-xs text-destructive">{errors.orgName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Default currency</Label>
          <Select
            defaultValue={currency ?? 'USD'}
            onValueChange={(v) =>
              setValue('currency', v as OrgInput['currency'], { shouldValidate: true })
            }
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}

// ── Step 2: Invite team ────────────────────────────────────────────────────────

function StepInvite({ onNext }: { onNext: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [invited, setInvited] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'department_head' },
  })

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null)
    setIsPending(true)
    const fd = new FormData()
    fd.set('fullName', data.fullName)
    fd.set('email', data.email)
    fd.set('role', data.role)
    const result = await inviteTeamMemberAction(fd)
    setIsPending(false)
    if (result.error) { setServerError(result.error); return }
    if (result.invited) {
      setInvited((prev) => [...prev, result.invited as string])
      reset()
    }
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">Invite your team</h2>
        <p className="text-sm text-muted-foreground">
          Add department heads and finance approvers. You can skip this and invite later.
        </p>
      </div>

      {invited.length > 0 && (
        <div className="space-y-1">
          {invited.map((email) => (
            <div
              key={email}
              className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4 text-primary shrink-0"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-muted-foreground">Invited</span>
              <span className="font-medium">{email}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inviteFullName">Full name</Label>
          <Input id="inviteFullName" placeholder="Dana Head" {...register('fullName')} />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inviteEmail">Email</Label>
          <Input
            id="inviteEmail"
            type="email"
            placeholder="colleague@company.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inviteRole">Role</Label>
          <Select
            defaultValue="department_head"
            onValueChange={(v) =>
              setValue('role', v as InviteInput['role'], { shouldValidate: true })
            }
          >
            <SelectTrigger id="inviteRole">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
          {isPending ? 'Sending invite…' : '+ Send invite'}
        </Button>
      </form>

      <Button className="w-full" onClick={onNext}>
        {invited.length > 0 ? 'Continue' : 'Skip for now'}
      </Button>
    </div>
  )
}

// ── Step 3: Done ────────────────────────────────────────────────────────────────

function StepDone() {
  const [isPending, setIsPending] = useState(false)

  const handleComplete = async () => {
    setIsPending(true)
    await completeOnboardingAction()
    // redirect() in the action navigates away; no need to reset state
  }

  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-8 h-8 text-primary"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-xl font-semibold">You&apos;re all set!</h2>
        <p className="text-sm text-muted-foreground">
          Your organisation is ready. Let&apos;s start managing procurement intelligently.
        </p>
      </div>

      <ul className="text-left space-y-2 text-sm text-muted-foreground">
        {['Organisation created', 'Team invites sent', 'AI scoring engine ready'].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-primary shrink-0"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <Button className="w-full" disabled={isPending} onClick={handleComplete}>
        {isPending ? 'Launching…' : 'Go to dashboard'}
      </Button>
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────────────────────────────

interface Props {
  orgName: string
  currency: string
}

export default function OnboardingWizard({ orgName, currency }: Props) {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="text-sm text-muted-foreground font-medium mb-2">
          Getting started with ProcureMaster
        </p>
        <StepIndicator current={step} total={3} />

        {step === 1 && (
          <StepOrg orgName={orgName} currency={currency} onNext={() => setStep(2)} />
        )}
        {step === 2 && <StepInvite onNext={() => setStep(3)} />}
        {step === 3 && <StepDone />}
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InviteAcceptForm from './invite-accept-form'

interface Props {
  params: { token: string }
}

export default async function InviteAcceptPage({ params }: Props) {
  const supabase = createClient()

  // Look up the vendor invite by token
  const { data: invite, error } = await supabase
    .from('vendor_invites')
    .select('id, rfp_id, vendor_account_id, status, expires_at')
    .eq('token', params.token)
    .maybeSingle()

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-3">
          <h1 className="font-heading text-xl font-semibold">Invalid invite</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has already been used.
          </p>
        </div>
      </div>
    )
  }

  if (invite.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-3">
          <h1 className="font-heading text-xl font-semibold">Invite already used</h1>
          <p className="text-sm text-muted-foreground">
            This invite has already been accepted or has expired.
          </p>
        </div>
      </div>
    )
  }

  const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date()
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-3">
          <h1 className="font-heading text-xl font-semibold">Invite expired</h1>
          <p className="text-sm text-muted-foreground">
            This invite link has expired. Please ask the procurement team to send a new one.
          </p>
        </div>
      </div>
    )
  }

  return <InviteAcceptForm token={params.token} inviteId={invite.id} />
}

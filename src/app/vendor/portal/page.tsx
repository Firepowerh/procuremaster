import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DocumentUploader from './document-uploader'

const SUBMISSION_STATUS_CLASS: Record<string, string> = {
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

const EXTRACTION_CLASS: Record<string, string> = {
  queued: 'text-slate-500',
  processing: 'text-amber-600',
  extracted: 'text-emerald-600',
  failed: 'text-destructive',
}

export default async function VendorPortalPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendorAccount } = await supabase
    .from('vendor_accounts')
    .select('id, company_name, org_id, is_active')
    .eq('auth_user_id', user.id)
    .single()

  if (!vendorAccount) redirect('/login')

  const { data: entries } = await supabase
    .from('rfp_vendor_entries')
    .select('id, status, rfp_id, rfps(id, title, department, submission_deadline, status)')
    .eq('vendor_account_id', vendorAccount.id)
    .order('created_at', { ascending: false })

  const rfpIds = (entries ?? []).map((e) => e.rfp_id)

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, rfp_id, status, submitted_at')
    .eq('vendor_account_id', vendorAccount.id)
    .in('rfp_id', rfpIds.length > 0 ? rfpIds : ['none'])

  const submissionMap = new Map((submissions ?? []).map((s) => [s.rfp_id, s]))

  const subIds = (submissions ?? []).map((s) => s.id)
  const { data: documents } = await supabase
    .from('documents')
    .select('id, submission_id, file_name, file_size_bytes, extraction_status, created_at')
    .in('submission_id', subIds.length > 0 ? subIds : ['none'])
    .order('created_at', { ascending: false })

  const docsBySubmission = new Map<string, NonNullable<typeof documents>>()
  for (const doc of documents ?? []) {
    const arr = docsBySubmission.get(doc.submission_id) ?? []
    arr.push(doc)
    docsBySubmission.set(doc.submission_id, arr)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold">{vendorAccount.company_name}</h1>
            <p className="text-sm text-muted-foreground">Vendor Portal</p>
          </div>
        </div>

        {(entries ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No active RFPs</p>
            <p className="text-xs text-muted-foreground mt-1">
              You haven&apos;t been invited to any RFPs yet.
            </p>
          </div>
        ) : (
          (entries ?? []).map((entry) => {
            const rfp = (entry.rfps as unknown) as {
              id: string
              title: string
              department: string
              submission_deadline: string | null
              status: string
            } | null
            if (!rfp) return null

            const submission = submissionMap.get(entry.rfp_id)
            const docs = submission ? (docsBySubmission.get(submission.id) ?? []) : []
            const isDeadlinePast = rfp.submission_deadline
              ? new Date(rfp.submission_deadline) < new Date()
              : false
            const canUpload = !isDeadlinePast && entry.status !== 'not_selected' && submission?.status !== 'submitted'

            return (
              <Card key={entry.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base font-semibold font-heading">
                        {rfp.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{rfp.department}</p>
                    </div>
                    {submission && (
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SUBMISSION_STATUS_CLASS[submission.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {submission.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {rfp.submission_deadline && (
                    <div
                      className={`flex items-center gap-1.5 text-xs mt-1 ${isDeadlinePast ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      <Clock className="w-3 h-3" />
                      {isDeadlinePast ? 'Deadline passed · ' : 'Deadline: '}
                      {new Date(rfp.submission_deadline).toLocaleString()}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {docs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Uploaded Documents
                      </p>
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium truncate">{doc.file_name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {(doc.file_size_bytes / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-medium shrink-0 ${EXTRACTION_CLASS[doc.extraction_status]}`}
                          >
                            {doc.extraction_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {canUpload && (
                    <DocumentUploader
                      rfpId={rfp.id}
                      vendorAccountId={vendorAccount.id}
                      orgId={vendorAccount.org_id}
                      submissionId={submission?.id ?? null}
                      submissionStatus={submission?.status ?? null}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

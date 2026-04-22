import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, FileText, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CriteriaPanel from './criteria-panel'
import ScoringMatrix from './scoring-matrix'
import SendForApproval from './send-for-approval'

const SEVERITY_CLASS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

interface PageProps {
  params: { id: string }
}

export default async function EvaluationDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'procurement_manager') redirect('/dashboard')

  const orgId = profile.org_id as string

  // Step 1: fetch evaluation first so we can extract rfp_id for subsequent queries
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select(
      'id, rfp_id, status, scoring_run_count, report_executive_summary, report_recommendation, report_generated_at, rfps(id, title, department)'
    )
    .eq('id', params.id)
    .eq('org_id', orgId)
    .single()

  if (!evaluation) notFound()

  // Step 2: parallel queries — vendor entries now scoped to this evaluation's RFP
  const [
    { data: criteria },
    { data: vendorEntries },
    { data: approvers },
    { data: scores },
  ] = await Promise.all([
    supabase
      .from('evaluation_criteria')
      .select('id, name, description, weight, is_ai_suggested, sort_order')
      .eq('evaluation_id', params.id)
      .order('sort_order'),
    supabase
      .from('rfp_vendor_entries')
      .select('vendor_account_id, vendor_accounts(id, company_name)')
      .eq('rfp_id', evaluation.rfp_id)
      .eq('org_id', orgId),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('org_id', orgId)
      .eq('role', 'finance_approver'),
    supabase
      .from('vendor_scores')
      .select(
        'id, criterion_id, vendor_account_id, ai_score, ai_reasoning, override_score, override_justification, effective_score'
      )
      .eq('evaluation_id', params.id),
  ])

  const rfp = (evaluation.rfps as unknown) as { id: string; title: string; department: string } | null

  // Get vendor list from entries for this RFP
  const vendors = (vendorEntries ?? [])
    .map((e) => (e.vendor_accounts as unknown) as { id: string; company_name: string } | null)
    .filter(Boolean) as { id: string; company_name: string }[]

  // Deduplicate vendors
  const uniqueVendors = Array.from(new Map(vendors.map((v) => [v.id, v])).values())

  // Get compliance flags from documents in this RFP's submissions
  const { data: flags } = await supabase
    .from('compliance_flags')
    .select(
      'id, flag_type, severity, clause_text, explanation, status, documents(file_name, submissions(vendor_account_id, vendor_accounts(company_name)))'
    )
    .eq('org_id', orgId)
    .order('severity', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-5 max-w-5xl">
      <Link
        href="/evaluations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to Evaluations
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {rfp?.title ?? 'Evaluation'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {rfp?.department} · {evaluation.status.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Criteria */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Evaluation Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <CriteriaPanel
                evaluationId={params.id}
                criteria={(criteria ?? []) as {
                  id: string
                  name: string
                  description: string | null
                  weight: number
                  is_ai_suggested: boolean
                }[]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Scoring matrix */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Scoring Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoringMatrix
                evaluationId={params.id}
                criteria={(criteria ?? []) as { id: string; name: string; weight: number }[]}
                vendors={uniqueVendors}
                scores={(scores ?? []) as {
                  id: string
                  criterion_id: string
                  vendor_account_id: string
                  ai_score: number | null
                  ai_reasoning: string | null
                  override_score: number | null
                  override_justification: string | null
                  effective_score: number | null
                }[]}
                status={evaluation.status}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send for approval */}
      {(evaluation.status === 'scored' || evaluation.status === 'report_generated') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Send for Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <SendForApproval
              evaluationId={params.id}
              vendors={uniqueVendors}
              approvers={(approvers ?? []) as { id: string; full_name: string }[]}
            />
          </CardContent>
        </Card>
      )}

      {/* Compliance flags */}
      {(flags ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Compliance Flags ({flags?.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(flags ?? []).map((f) => {
              const doc = (f.documents as unknown) as {
                file_name: string
                submissions: { vendor_accounts: { company_name: string } | null } | null
              } | null
              const vendorName = doc?.submissions?.vendor_accounts?.company_name

              return (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_CLASS[f.severity]}`}
                  >
                    {f.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{f.flag_type.replace(/_/g, ' ')}</span>
                      {vendorName && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{vendorName}</span>
                        </>
                      )}
                      {doc?.file_name && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            {doc.file_name}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.explanation}</p>
                    {f.clause_text && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                        &ldquo;{f.clause_text}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* AI Report */}
      {evaluation.report_executive_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">AI Evaluation Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Executive Summary
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {evaluation.report_executive_summary}
              </p>
            </div>
            {evaluation.report_recommendation && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Recommendation
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {evaluation.report_recommendation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

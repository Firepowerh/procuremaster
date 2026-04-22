import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { scoreVendorAgainstCriteria, generateEvaluationReport } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  let evaluation_id: string | undefined
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { evaluation_id: string }
    evaluation_id = body.evaluation_id
    if (!evaluation_id) return NextResponse.json({ error: 'evaluation_id required' }, { status: 400 })

    // Fetch evaluation + criteria
    const { data: evaluation } = await supabaseAdmin
      .from('evaluations')
      .select('id, org_id, rfp_id, scoring_run_count, rfps(title)')
      .eq('id', evaluation_id)
      .single()

    if (!evaluation) return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })

    const rfpTitle = ((evaluation.rfps as unknown) as { title: string } | null)?.title ?? 'RFP'
    const nextRun = (evaluation.scoring_run_count ?? 0) + 1

    const { data: criteria } = await supabaseAdmin
      .from('evaluation_criteria')
      .select('id, name, description, weight')
      .eq('evaluation_id', evaluation_id)
      .order('sort_order')

    if (!criteria || criteria.length === 0) {
      return NextResponse.json({ error: 'No criteria defined' }, { status: 400 })
    }

    // Fetch all submitted vendor entries for this RFP
    const { data: entries } = await supabaseAdmin
      .from('rfp_vendor_entries')
      .select('vendor_account_id, vendor_accounts(id, company_name)')
      .eq('rfp_id', evaluation.rfp_id)
      .in('status', ['submitted', 'under_review', 'shortlisted', 'approved'])

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No vendor submissions found' }, { status: 400 })
    }

    // Update evaluation status
    await supabaseAdmin
      .from('evaluations')
      .update({ status: 'scoring_in_progress', scoring_run_count: nextRun })
      .eq('id', evaluation_id)

    // Score each vendor
    const vendorResults = []
    for (const entry of entries) {
      const vendor = (entry.vendor_accounts as unknown) as { id: string; company_name: string } | null
      if (!vendor) continue

      // Get extracted documents for this vendor
      const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('rfp_id', evaluation.rfp_id)
        .eq('vendor_account_id', vendor.id)
        .single()

      let vendorDocs: { file_name: string; extracted_summary: string | null; raw_extraction: string | null }[] = []

      if (submissions) {
        const { data: docs } = await supabaseAdmin
          .from('documents')
          .select('file_name, raw_extraction')
          .eq('submission_id', submissions.id)
          .eq('extraction_status', 'extracted')

        vendorDocs = (docs ?? []).map((d) => ({
          file_name: d.file_name,
          extracted_summary: null,
          raw_extraction: d.raw_extraction ? JSON.stringify(d.raw_extraction) : null,
        }))
      }

      const result = await scoreVendorAgainstCriteria(
        { id: vendor.id, company_name: vendor.company_name, documents: vendorDocs },
        criteria,
        rfpTitle
      )

      // Upsert vendor scores
      for (const score of result.scores) {
        await supabaseAdmin.from('vendor_scores').upsert(
          {
            org_id: evaluation.org_id,
            evaluation_id,
            criterion_id: score.criterion_id,
            vendor_account_id: vendor.id,
            scoring_run: nextRun,
            ai_score: score.ai_score,
            ai_reasoning: score.ai_reasoning,
            ai_scored_at: new Date().toISOString(),
          },
          { onConflict: 'evaluation_id,criterion_id,vendor_account_id,scoring_run' }
        )
      }

      vendorResults.push({ vendor, scores: result.scores })
    }

    // Generate report
    const vendorScoreSummaries = vendorResults.map((vr) => {
      const breakdown = vr.scores.map((s) => {
        const criterion = criteria.find((c) => c.id === s.criterion_id)
        return {
          criterion: criterion?.name ?? s.criterion_id,
          score: s.ai_score,
          weight: criterion?.weight ?? 0,
        }
      })
      const weighted_total =
        breakdown.reduce((sum, b) => sum + (b.score * b.weight) / 100, 0)
      return { company_name: vr.vendor.company_name, weighted_total, score_breakdown: breakdown }
    })

    const report = await generateEvaluationReport(rfpTitle, vendorScoreSummaries, criteria)

    // Save report + mark complete
    await supabaseAdmin
      .from('evaluations')
      .update({
        status: 'scored',
        last_scored_at: new Date().toISOString(),
        report_executive_summary: report.executive_summary,
        report_recommendation: report.recommendation,
        report_generated_at: new Date().toISOString(),
      })
      .eq('id', evaluation_id)

    return NextResponse.json({ success: true, vendors_scored: vendorResults.length, run: nextRun })
  } catch (err) {
    console.error('[score]', err)
    if (evaluation_id) {
      await supabaseAdmin
        .from('evaluations')
        .update({ status: 'criteria_pending' })
        .eq('id', evaluation_id)
    }
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { suggestEvaluationCriteria } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { evaluation_id } = await request.json() as { evaluation_id: string }
    if (!evaluation_id) return NextResponse.json({ error: 'evaluation_id required' }, { status: 400 })

    // Fetch evaluation + RFP
    const { data: evaluation } = await supabaseAdmin
      .from('evaluations')
      .select('id, org_id, rfp_id, rfps(title, description, department)')
      .eq('id', evaluation_id)
      .single()

    if (!evaluation) return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })

    const rfp = (evaluation.rfps as unknown) as { title: string; description: string; department: string } | null
    if (!rfp) return NextResponse.json({ error: 'RFP not found' }, { status: 404 })

    // Generate criteria with Gemini
    const criteria = await suggestEvaluationCriteria(rfp.title, rfp.description, rfp.department)

    // Delete existing AI-suggested criteria (keep PM-added ones)
    await supabaseAdmin
      .from('evaluation_criteria')
      .delete()
      .eq('evaluation_id', evaluation_id)
      .eq('is_ai_suggested', true)

    // Insert new criteria
    const { data: inserted } = await supabaseAdmin
      .from('evaluation_criteria')
      .insert(
        criteria.map((c) => ({
          org_id: evaluation.org_id,
          evaluation_id,
          name: c.name,
          description: c.description,
          weight: c.weight,
          sort_order: c.sort_order,
          is_ai_suggested: true,
        }))
      )
      .select('id, name, description, weight, sort_order, is_ai_suggested')

    return NextResponse.json({ criteria: inserted })
  } catch (err) {
    console.error('[suggest-criteria]', err)
    return NextResponse.json({ error: 'Criteria suggestion failed' }, { status: 500 })
  }
}

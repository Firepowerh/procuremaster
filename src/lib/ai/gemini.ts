import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
const geminiFallback = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// Retry with exponential backoff; falls back to gemini-2.0-flash on 503
export async function generateWithRetry(
  prompt: Parameters<typeof geminiFlash.generateContent>[0],
  retries = 3
): Promise<Awaited<ReturnType<typeof geminiFlash.generateContent>>> {
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    const model = i < 2 ? geminiFlash : geminiFallback
    try {
      return await model.generateContent(prompt)
    } catch (err: unknown) {
      lastErr = err
      const status = (err as { status?: number })?.status
      if (status !== 503 && status !== 429) throw err
      await new Promise((r) => setTimeout(r, 5000 * (i + 1)))
    }
  }
  throw lastErr
}

// ── Document extraction ────────────────────────────────────────────────────────

export interface ExtractedDocumentData {
  vendor_name: string | null
  pricing: string | null
  payment_terms: string | null
  delivery: string | null
  sla: string | null
  warranty: string | null
  termination: string | null
  data_privacy: string | null
  summary: string | null
}

export interface ComplianceFlagData {
  flag_type:
    | 'payment_terms'
    | 'penalty_clause'
    | 'fee_structure'
    | 'price_escalation'
    | 'auto_renewal'
    | 'liability_limitation'
    | 'unilateral_modification'
    | 'jurisdiction'
    | 'ip_ownership'
    | 'data_breach_notification'
  severity: 'high' | 'medium' | 'low'
  clause_text: string | null
  explanation: string
}

export interface DocumentExtractionResult {
  extracted: ExtractedDocumentData
  compliance_flags: ComplianceFlagData[]
}

export async function extractDocumentData(
  documentText: string,
  fileName: string
): Promise<DocumentExtractionResult> {
  const prompt = `You are a procurement document analyst. Analyze the following vendor proposal document and extract key information.

Document: "${fileName}"

Content:
${documentText.slice(0, 30000)}

Respond with ONLY valid JSON matching this exact schema:
{
  "extracted": {
    "vendor_name": "string or null",
    "pricing": "concise summary of pricing structure or null",
    "payment_terms": "payment schedule/terms or null",
    "delivery": "delivery timeline/terms or null",
    "sla": "service level agreements or null",
    "warranty": "warranty terms or null",
    "termination": "termination clauses or null",
    "data_privacy": "data privacy/GDPR terms or null",
    "summary": "2-3 sentence executive summary of this proposal"
  },
  "compliance_flags": [
    {
      "flag_type": one of: "payment_terms"|"penalty_clause"|"fee_structure"|"price_escalation"|"auto_renewal"|"liability_limitation"|"unilateral_modification"|"jurisdiction"|"ip_ownership"|"data_breach_notification",
      "severity": "high"|"medium"|"low",
      "clause_text": "exact quoted text from document or null",
      "explanation": "why this is a concern"
    }
  ]
}

Only flag genuine compliance concerns. If none, return an empty array.`

  const result = await generateWithRetry(prompt)
  const text = result.response.text()

  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  return JSON.parse(json) as DocumentExtractionResult
}

// ── Criteria suggestion ────────────────────────────────────────────────────────

export interface SuggestedCriterion {
  name: string
  description: string
  weight: number
  sort_order: number
}

export async function suggestEvaluationCriteria(
  rfpTitle: string,
  rfpDescription: string,
  department: string
): Promise<SuggestedCriterion[]> {
  const prompt = `You are a procurement expert. Suggest evaluation criteria for the following RFP.

RFP Title: ${rfpTitle}
Department: ${department}
Description: ${rfpDescription}

Generate 5-7 evaluation criteria. Weights must sum to exactly 100.

Respond with ONLY valid JSON array:
[
  {
    "name": "criterion name (3-5 words)",
    "description": "what evaluators should assess (1-2 sentences)",
    "weight": number (0-100, all weights sum to 100),
    "sort_order": number (1-based)
  }
]`

  const result = await generateWithRetry(prompt)
  const text = result.response.text()
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(json) as SuggestedCriterion[]
}

// ── Vendor scoring ────────────────────────────────────────────────────────────

export interface VendorScoreResult {
  vendor_account_id: string
  scores: {
    criterion_id: string
    ai_score: number
    ai_reasoning: string
  }[]
}

export async function scoreVendorAgainstCriteria(
  vendor: {
    id: string
    company_name: string
    documents: { file_name: string; extracted_summary: string | null; raw_extraction: string | null }[]
  },
  criteria: { id: string; name: string; description: string; weight: number }[],
  rfpTitle: string
): Promise<VendorScoreResult> {
  const vendorContext = vendor.documents
    .map((d) => `File: ${d.file_name}\nSummary: ${d.extracted_summary ?? 'No summary'}\nData: ${d.raw_extraction ? d.raw_extraction.slice(0, 2000) : 'N/A'}`)
    .join('\n\n')

  const criteriaList = criteria
    .map((c) => `- ID: ${c.id}\n  Name: ${c.name}\n  Description: ${c.description}\n  Weight: ${c.weight}%`)
    .join('\n')

  const prompt = `You are evaluating vendor "${vendor.company_name}" for the RFP: "${rfpTitle}".

Vendor proposal documents:
${vendorContext}

Evaluation criteria:
${criteriaList}

Score this vendor on each criterion from 0-10 (0=very poor, 10=excellent).
Base your scores only on the provided document content.

Respond with ONLY valid JSON:
{
  "scores": [
    {
      "criterion_id": "exact criterion id from above",
      "ai_score": number (0-10, one decimal place),
      "ai_reasoning": "1-2 sentences explaining the score based on document evidence"
    }
  ]
}`

  const result = await generateWithRetry(prompt)
  const text = result.response.text()
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  const parsed = JSON.parse(json) as { scores: VendorScoreResult['scores'] }

  return {
    vendor_account_id: vendor.id,
    scores: parsed.scores,
  }
}

// ── Evaluation report ─────────────────────────────────────────────────────────

export interface EvaluationReport {
  executive_summary: string
  recommendation: string
}

export async function generateEvaluationReport(
  rfpTitle: string,
  vendorScores: {
    company_name: string
    weighted_total: number
    score_breakdown: { criterion: string; score: number; weight: number }[]
  }[],
  criteria: { name: string; weight: number }[]
): Promise<EvaluationReport> {
  const scoreTable = vendorScores
    .sort((a, b) => b.weighted_total - a.weighted_total)
    .map(
      (v) =>
        `${v.company_name}: ${v.weighted_total.toFixed(1)}/10\n` +
        v.score_breakdown.map((s) => `  - ${s.criterion}: ${s.score}/10 (${s.weight}%)`).join('\n')
    )
    .join('\n\n')

  const prompt = `You are a procurement manager writing an evaluation report for the RFP: "${rfpTitle}".

Vendor scores:
${scoreTable}

Write a professional procurement evaluation report.

Respond with ONLY valid JSON:
{
  "executive_summary": "3-4 paragraph objective summary of the evaluation findings, comparing vendors across key criteria",
  "recommendation": "1-2 paragraph recommendation identifying the preferred vendor and justification, or if no clear winner, what additional information is needed"
}`

  const result = await generateWithRetry(prompt)
  const text = result.response.text()
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(json) as EvaluationReport
}

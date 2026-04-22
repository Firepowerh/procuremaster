import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { extractDocumentData, generateWithRetry } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  let document_id: string | undefined
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { document_id: string }
    document_id = body.document_id
    if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

    // Fetch document record
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('id, org_id, file_name, storage_path, extraction_status, extraction_attempts')
      .eq('id', document_id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    if (doc.extraction_attempts >= 3) {
      return NextResponse.json({ error: 'Max extraction attempts reached' }, { status: 429 })
    }

    // Mark as processing
    await supabaseAdmin
      .from('documents')
      .update({ extraction_status: 'processing', extraction_attempts: doc.extraction_attempts + 1 })
      .eq('id', document_id)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      await supabaseAdmin
        .from('documents')
        .update({ extraction_status: 'failed', extraction_error: downloadError?.message ?? 'Download failed' })
        .eq('id', document_id)
      return NextResponse.json({ error: 'File download failed' }, { status: 500 })
    }

    // Convert to text
    let text: string
    const fileName = doc.file_name.toLowerCase()

    if (fileName.endsWith('.pdf')) {
      // For PDFs, use Gemini's file API with the raw bytes
      const buffer = await fileData.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      // Use Gemini inline data for PDF
      const extractResult = await generateWithRetry([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64,
          },
        },
        {
          text: `Extract all text content from this PDF document. Return only the raw text, no formatting.`,
        },
      ])
      text = extractResult.response.text()
    } else {
      // For text-based files (DOCX treated as text approximation)
      text = await fileData.text()
    }

    // Run Gemini extraction
    const result = await extractDocumentData(text, doc.file_name)

    // Persist extraction results
    await supabaseAdmin
      .from('documents')
      .update({
        extraction_status: 'extracted',
        last_extracted_at: new Date().toISOString(),
        raw_extraction: result as unknown as Record<string, unknown>,
        extracted_vendor_name: result.extracted.vendor_name,
        extracted_pricing: result.extracted.pricing,
        extracted_payment_terms: result.extracted.payment_terms,
        extracted_delivery: result.extracted.delivery,
        extracted_sla: result.extracted.sla,
        extracted_warranty: result.extracted.warranty,
        extracted_termination: result.extracted.termination,
        extracted_data_privacy: result.extracted.data_privacy,
      })
      .eq('id', document_id)

    // Create compliance flags
    if (result.compliance_flags.length > 0) {
      await supabaseAdmin.from('compliance_flags').insert(
        result.compliance_flags.map((f) => ({
          org_id: doc.org_id,
          document_id: document_id,
          flag_type: f.flag_type,
          severity: f.severity,
          clause_text: f.clause_text,
          explanation: f.explanation,
        }))
      )
    }

    return NextResponse.json({ success: true, flags: result.compliance_flags.length })
  } catch (err) {
    console.error('[extract]', err)
    // Mark document as failed so it doesn't stay stuck in 'processing'
    if (document_id) {
      await supabaseAdmin
        .from('documents')
        .update({ extraction_status: 'failed', extraction_error: err instanceof Error ? err.message : 'Unknown error' })
        .eq('id', document_id)
    }
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}

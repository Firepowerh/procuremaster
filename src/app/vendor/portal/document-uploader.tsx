'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  rfpId: string
  vendorAccountId: string
  orgId: string
  submissionId: string | null
  submissionStatus: string | null
}

const ACCEPTED = '.pdf,.docx,.xlsx'
const MAX_MB = 20

export default function DocumentUploader({
  rfpId,
  vendorAccountId,
  orgId,
  submissionId,
  submissionStatus,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentSubId, setCurrentSubId] = useState(submissionId)
  const [currentStatus, setCurrentStatus] = useState(submissionStatus)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB}MB`)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'xlsx'].includes(ext ?? '')) {
      toast.error('Only PDF, DOCX, and XLSX files are accepted')
      return
    }

    setUploading(true)

    try {
      // 1. Ensure submission record exists
      let subId = currentSubId

      if (!subId) {
        // Get or create rfp_vendor_entry
        const { data: entry } = await supabase
          .from('rfp_vendor_entries')
          .select('id')
          .eq('rfp_id', rfpId)
          .eq('vendor_account_id', vendorAccountId)
          .single()

        if (!entry) throw new Error('RFP entry not found')

        const { data: newSub, error: subErr } = await supabase
          .from('submissions')
          .insert({
            org_id: orgId,
            rfp_id: rfpId,
            vendor_account_id: vendorAccountId,
            rfp_vendor_entry_id: entry.id,
            status: 'in_progress',
          })
          .select('id')
          .single()

        if (subErr) throw new Error(subErr.message)
        subId = newSub.id
        setCurrentSubId(newSub.id)
        setCurrentStatus('in_progress')
      }

      // 2. Upload to Supabase Storage
      const storagePath = `${orgId}/${rfpId}/${vendorAccountId}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false })

      if (uploadErr) throw new Error(uploadErr.message)

      // 3. Create document record
      const docType = (ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'xlsx') as 'pdf' | 'docx' | 'xlsx'
      const { data: docRecord, error: docErr } = await supabase
        .from('documents')
        .insert({
          org_id: orgId,
          submission_id: subId,
          file_name: file.name,
          file_type: docType,
          file_size_bytes: file.size,
          storage_path: storagePath,
          extraction_status: 'queued',
        })
        .select('id')
        .single()

      if (docErr) throw new Error(docErr.message)

      toast.success(`${file.name} uploaded`)

      // 4. Trigger AI extraction in background
      fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docRecord.id }),
      }).catch(() => {/* extraction runs in background */})

      // Reset file input
      if (fileRef.current) fileRef.current.value = ''

      // Reload to show the new document
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!currentSubId) return toast.error('Upload at least one document first')
    setSubmitting(true)

    const { error } = await supabase
      .from('submissions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', currentSubId)

    setSubmitting(false)

    if (error) {
      toast.error(error.message)
    } else {
      // Update vendor entry status
      await supabase
        .from('rfp_vendor_entries')
        .update({ status: 'submitted' })
        .eq('rfp_id', rfpId)
        .eq('vendor_account_id', vendorAccountId)

      toast.success('Proposal submitted!')
      setCurrentStatus('submitted')
      setTimeout(() => window.location.reload(), 500)
    }
  }

  return (
    <div className="space-y-3">
      {/* File picker */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading and queuing extraction...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground/50" />
            <p className="text-sm font-medium">Click to upload document</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX · Max {MAX_MB}MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      {/* Submit proposal button */}
      {currentSubId && currentStatus !== 'submitted' && (
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting}
          variant="default"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Submit Proposal
        </Button>
      )}
    </div>
  )
}

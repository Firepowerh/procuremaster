-- Individual uploaded files with AI extraction results
CREATE TABLE public.documents (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  submission_id            uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  file_name                text NOT NULL,
  file_type                public.document_type NOT NULL,
  file_size_bytes          bigint NOT NULL,
  storage_path             text NOT NULL,
  extraction_status        public.extraction_status NOT NULL DEFAULT 'queued',
  extraction_error         text,
  extraction_attempts      int NOT NULL DEFAULT 0,
  last_extracted_at        timestamptz,
  -- Raw AI output
  raw_extraction           jsonb,
  -- Promoted key fields
  extracted_vendor_name    text,
  extracted_pricing        text,
  extracted_payment_terms  text,
  extracted_delivery       text,
  extracted_sla            text,
  extracted_warranty       text,
  extracted_termination    text,
  extracted_data_privacy   text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_submission_idx          ON public.documents (submission_id);
CREATE INDEX documents_extraction_status_idx   ON public.documents (extraction_status);

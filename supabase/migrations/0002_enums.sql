-- All ENUM type definitions

CREATE TYPE public.user_role AS ENUM (
  'procurement_manager',
  'department_head',
  'finance_approver'
);

CREATE TYPE public.invite_status AS ENUM (
  'pending',
  'accepted',
  'expired'
);

CREATE TYPE public.requirement_status AS ENUM (
  'draft', 'submitted', 'in_progress', 'vendor_selected', 'closed'
);

CREATE TYPE public.requirement_priority AS ENUM (
  'low', 'medium', 'high', 'critical'
);

CREATE TYPE public.rfp_status AS ENUM (
  'requirements_received', 'rfp_created', 'vendors_invited',
  'submissions_in', 'under_evaluation', 'shortlisted',
  'approval_pending', 'contracted', 'archived'
);

CREATE TYPE public.vendor_pipeline_status AS ENUM (
  'invited', 'submitted', 'under_review', 'shortlisted',
  'approved', 'not_selected', 'contracted'
);

CREATE TYPE public.submission_status AS ENUM (
  'in_progress',
  'submitted',
  'under_review'
);

CREATE TYPE public.document_type AS ENUM ('pdf', 'docx', 'xlsx');

CREATE TYPE public.extraction_status AS ENUM (
  'queued', 'processing', 'extracted', 'failed'
);

CREATE TYPE public.evaluation_status AS ENUM (
  'not_started',
  'criteria_pending',
  'scoring_in_progress',
  'scored',
  'report_generated'
);

CREATE TYPE public.flag_severity AS ENUM ('high', 'medium', 'low');

CREATE TYPE public.flag_type AS ENUM (
  'payment_terms', 'penalty_clause', 'fee_structure',
  'price_escalation', 'auto_renewal',
  'liability_limitation', 'unilateral_modification',
  'jurisdiction', 'ip_ownership', 'data_breach_notification'
);

CREATE TYPE public.flag_status AS ENUM ('open', 'acknowledged', 'escalated');

CREATE TYPE public.approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'recalled'
);

CREATE TYPE public.rejection_reason AS ENUM (
  'budget_concerns', 'compliance_risk',
  'insufficient_information', 'other'
);

CREATE TYPE public.contract_status AS ENUM (
  'active', 'expiring_soon', 'expired', 'terminated'
);

CREATE TYPE public.activity_entity AS ENUM (
  'organisation', 'profile', 'vendor_account', 'requirement',
  'rfp', 'rfp_vendor_entry', 'submission', 'document',
  'evaluation', 'vendor_score', 'compliance_flag',
  'approval_request', 'contract', 'scoring_template'
);

CREATE TYPE public.notification_type AS ENUM (
  'vendor_submitted', 'scoring_complete', 'extraction_failed',
  'approval_requested', 'approval_sla_warning', 'approval_decided',
  'renewal_alert', 'vendor_status_updated', 'requirement_submitted',
  'evaluation_ready'
);

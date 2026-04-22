-- Apply set_updated_at trigger to all tables with updated_at column
CREATE TRIGGER organisations_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER vendor_accounts_updated_at
  BEFORE UPDATE ON public.vendor_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirements_updated_at
  BEFORE UPDATE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER rfps_updated_at
  BEFORE UPDATE ON public.rfps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER rfp_vendor_entries_updated_at
  BEFORE UPDATE ON public.rfp_vendor_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER evaluation_criteria_updated_at
  BEFORE UPDATE ON public.evaluation_criteria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER vendor_scores_updated_at
  BEFORE UPDATE ON public.vendor_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER compliance_flags_updated_at
  BEFORE UPDATE ON public.compliance_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER scoring_templates_updated_at
  BEFORE UPDATE ON public.scoring_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create evaluation when RFP is created
CREATE TRIGGER rfp_evaluation_created
  AFTER INSERT ON public.rfps
  FOR EACH ROW EXECUTE FUNCTION public.create_evaluation_for_rfp();

-- Auto-create contract when approval is approved
CREATE TRIGGER approval_creates_contract
  AFTER UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_contract_on_approval();

-- Validate criteria weights on insert/update
CREATE TRIGGER criteria_weight_check
  BEFORE INSERT OR UPDATE ON public.evaluation_criteria
  FOR EACH ROW EXECUTE FUNCTION public.validate_criteria_weights();

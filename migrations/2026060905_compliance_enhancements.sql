-- 2026060905_compliance_enhancements.sql

-- 1. Update ic_compliance_types_master with new applicability flags
ALTER TABLE public.ic_compliance_types_master 
  RENAME COLUMN requires_document TO attachment_applicable;

ALTER TABLE public.ic_compliance_types_master 
  ADD COLUMN expiry_date_applicable BOOLEAN DEFAULT TRUE,
  ADD COLUMN document_number_applicable BOOLEAN DEFAULT FALSE,
  ADD COLUMN comments_applicable BOOLEAN DEFAULT FALSE;

-- 2. Update ic_staff_compliance with new tracking columns
ALTER TABLE public.ic_staff_compliance 
  ADD COLUMN comments TEXT,
  ADD COLUMN document_number TEXT;

-- 3. Standard Audit Column Trigger for ic_staff_compliance (ensure standard behavior)
-- (Assuming ic_trigger_set_audit_columns already exists from earlier migrations)
-- We don't need to add it again if it's already there, but let's ensure ic_staff_compliance 
-- has everything it needs for auditing the new columns if they are updated separately.
-- Actually, the trigger handles any update on the table.

COMMENT ON COLUMN public.ic_compliance_types_master.expiry_date_applicable IS 'Toggle to show/hide expiry date input for this compliance type.';
COMMENT ON COLUMN public.ic_compliance_types_master.attachment_applicable IS 'Toggle to show/hide file attachment uploader for this compliance type.';
COMMENT ON COLUMN public.ic_compliance_types_master.document_number_applicable IS 'Toggle to show/hide document number input for this compliance type.';
COMMENT ON COLUMN public.ic_compliance_types_master.comments_applicable IS 'Toggle to show/hide comments textarea for this compliance type.';
COMMENT ON COLUMN public.ic_staff_compliance.comments IS 'Administrative or clinical comments regarding this specific compliance record.';
COMMENT ON COLUMN public.ic_staff_compliance.document_number IS 'Overall reference number for this compliance record (e.g. License Number).';

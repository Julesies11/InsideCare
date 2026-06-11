-- Migration: 2026061000_id_docs_tracking_enhancements.sql
-- Description: Adds tracking configuration columns to ic_id_document_types.

BEGIN;

-- 1. Rename expiry_required to expiry_date_applicable for consistency with master list
ALTER TABLE public.ic_id_document_types 
RENAME COLUMN expiry_required TO expiry_date_applicable;

-- 2. Add other applicability columns
ALTER TABLE public.ic_id_document_types
ADD COLUMN IF NOT EXISTS attachment_applicable boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS document_number_applicable boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS comments_applicable boolean NOT NULL DEFAULT true;

-- 3. Update comments for documentation
COMMENT ON COLUMN public.ic_id_document_types.expiry_date_applicable IS 'Toggle to show/hide expiry date input for this ID document type.';
COMMENT ON COLUMN public.ic_id_document_types.attachment_applicable IS 'Toggle to show/hide file attachment uploader for this ID document type.';
COMMENT ON COLUMN public.ic_id_document_types.document_number_applicable IS 'Toggle to show/hide document number input for this ID document type.';
COMMENT ON COLUMN public.ic_id_document_types.comments_applicable IS 'Toggle to show/hide comments field for this ID document type.';

COMMIT;

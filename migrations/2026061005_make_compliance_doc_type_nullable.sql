-- Migration: 2026061005_make_compliance_doc_type_nullable.sql
-- Description: Makes document_type and document_number columns nullable in ic_staff_compliance_documents to support generic attachments.

BEGIN;

ALTER TABLE public.ic_staff_compliance_documents 
ALTER COLUMN document_type DROP NOT NULL,
ALTER COLUMN document_number DROP NOT NULL;

COMMIT;

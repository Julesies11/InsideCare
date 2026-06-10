-- Migration: 2026061002_add_comments_to_verified_docs.sql
-- Description: Adds comments column to ic_staff_compliance_documents for per-document sighting notes.

BEGIN;

ALTER TABLE public.ic_staff_compliance_documents 
ADD COLUMN IF NOT EXISTS comments text;

COMMENT ON COLUMN public.ic_staff_compliance_documents.comments IS 'Additional notes or sighting comments for this specific identification document.';

COMMIT;

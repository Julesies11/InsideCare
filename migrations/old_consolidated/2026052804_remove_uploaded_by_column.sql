-- Migration: Remove uploaded_by from ic_participant_documents
-- Description: Drops foreign key constraint and column uploaded_by

ALTER TABLE public.ic_participant_documents DROP CONSTRAINT IF EXISTS participant_documents_uploaded_by_fkey;
ALTER TABLE public.ic_participant_documents DROP COLUMN IF EXISTS uploaded_by;

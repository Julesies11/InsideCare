-- Migration: 2026060101_standardize_shift_notes_constraint.sql
-- Description: Standardizes the unique constraint for ic_shift_notes to match the code and handle NULL participants.
-- Verified by: Gemini CLI Senior Engineer

BEGIN;

-- Drop both potential names to avoid confusion
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_uniqueness_key;
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_shift_staff_participant_key;

-- Re-create with the name used in the API and NULLS NOT DISTINCT
ALTER TABLE public.ic_shift_notes
ADD CONSTRAINT ic_shift_notes_shift_staff_participant_key 
UNIQUE NULLS NOT DISTINCT (shift_id, staff_id, participant_id);

COMMIT;

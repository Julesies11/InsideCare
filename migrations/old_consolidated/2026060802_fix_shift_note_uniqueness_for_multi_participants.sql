-- Migration: Fix Shift Note Uniqueness Constraint for Multi-Participant Shifts
-- Description: Drops overly restrictive unique index on (staff_id, shift_id) and replaces it
--              with a partial unique index on (staff_id, shift_id, participant_id) that
--              allows multiple notes per shift for different participants while still preventing duplicates.
-- Verified by: Senior Full Stack Developer & Security Researcher

BEGIN;

-- 1. Drop the overly restrictive staff/shift unique index
DROP INDEX IF EXISTS public.ic_shift_notes_staff_shift_unique_idx;

-- 2. Drop the legacy standard unique constraints if they exist, as they block new notes after soft-deleting
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_shift_staff_participant_key;
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_uniqueness_key;

-- 3. Deterministic Cleanup of Duplicates (Safeguard)
-- In case any duplicate active/draft notes exist for the same staff, shift, and participant,
-- this keeps the most complete note (or newest as tie-breaker) and removes the rest to ensure the index builds successfully.
DELETE FROM public.ic_shift_notes
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY staff_id, shift_id, COALESCE(participant_id, '00000000-0000-0000-0000-000000000000'::uuid)
             ORDER BY 
               -- Prioritize notes that have actual text content filled out
               (CASE WHEN (overall_presentation IS NOT NULL OR shift_summary IS NOT NULL OR full_note IS NOT NULL) THEN 1 ELSE 2 END) ASC,
               created_at DESC
           ) as row_num
    FROM public.ic_shift_notes
    WHERE shift_id IS NOT NULL AND status IN ('active', 'draft')
  ) t
  WHERE t.row_num > 1
);

-- 4. Create the corrected partial unique index
-- Enforces one active/draft note per staff, shift, and participant.
-- Handles NULL participant_id (General House Notes) correctly using NULLS NOT DISTINCT (Postgres 15+).
CREATE UNIQUE INDEX IF NOT EXISTS ic_shift_notes_staff_shift_participant_active_idx 
ON public.ic_shift_notes (staff_id, shift_id, participant_id) NULLS NOT DISTINCT
WHERE (shift_id IS NOT NULL AND status IN ('active', 'draft'));

COMMENT ON INDEX public.ic_shift_notes_staff_shift_participant_active_idx 
IS 'Prevents duplicate active/draft shift notes for the same staff, shift, and participant combination.';

COMMIT;

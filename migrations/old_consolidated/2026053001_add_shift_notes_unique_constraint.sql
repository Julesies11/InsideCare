-- Migration: 2026053001_add_shift_notes_unique_constraint.sql
-- Description: Adds a unique constraint to ic_shift_notes to support idempotent upserts.
--              Enforces the business rule that notes must be linked to a shift.
-- Verified by: Gemini CLI Senior Engineer & Security Researcher

BEGIN;

-- 1. Deterministic Cleanup of Duplicates
-- Keeps the newest record; uses id as a tie-breaker if timestamps match exactly.
DELETE FROM public.ic_shift_notes a
USING public.ic_shift_notes b
WHERE (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id))
  AND a.shift_id = b.shift_id
  AND a.staff_id = b.staff_id
  AND (a.participant_id = b.participant_id OR (a.participant_id IS NULL AND b.participant_id IS NULL));

-- 2. Add the Composite Unique Constraint
-- NULLS NOT DISTINCT (PG 15+) ensures only one 'General' (NULL participant) note per shift/staff.
ALTER TABLE public.ic_shift_notes
DROP CONSTRAINT IF EXISTS ic_shift_notes_uniqueness_key;

ALTER TABLE public.ic_shift_notes
ADD CONSTRAINT ic_shift_notes_uniqueness_key 
UNIQUE NULLS NOT DISTINCT (shift_id, staff_id, participant_id);

COMMIT;

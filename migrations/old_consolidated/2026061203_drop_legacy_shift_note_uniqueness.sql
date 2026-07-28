-- Migration: 2026061203_drop_legacy_shift_note_uniqueness.sql
-- Description: Removes overly restrictive legacy constraints that prevent multi-participant 
--              notes and block new submissions after soft-deleting.
-- Standard: IC-GOLD-DATABASE-MIGRATION
-- Verified by: Senior Software Engineer & Security Researcher

BEGIN;

-- 1. Exhaustive Cleanup of legacy names from the current table
-- We target the specific name reported in the error: "shift_notes_shift_staff_unique"
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS shift_notes_shift_staff_unique;
DROP INDEX IF EXISTS public.shift_notes_shift_staff_unique;

-- 2. Cleanup of variant/standardized names from previous refactor attempts
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_shift_staff_unique;
DROP INDEX IF EXISTS public.ic_shift_notes_shift_staff_unique;

ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_uniqueness_key;
ALTER TABLE public.ic_shift_notes DROP CONSTRAINT IF EXISTS ic_shift_notes_shift_staff_participant_key;
DROP INDEX IF EXISTS public.ic_shift_notes_staff_shift_unique_idx;

-- 3. Deterministic check for the legacy table name (safety for older envs)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shift_notes') THEN
        ALTER TABLE public.shift_notes DROP CONSTRAINT IF EXISTS shift_notes_shift_staff_unique;
        DROP INDEX IF EXISTS public.shift_notes_shift_staff_unique;
    END IF;
END $$;

-- 4. Re-verify the Correct Source of Truth
-- Enforces one active/draft note per staff, shift, and participant.
-- The partial index correctly ignores soft-deleted ('inactive') notes.
CREATE UNIQUE INDEX IF NOT EXISTS ic_shift_notes_staff_shift_participant_active_idx 
ON public.ic_shift_notes (staff_id, shift_id, participant_id) NULLS NOT DISTINCT
WHERE (shift_id IS NOT NULL AND status IN ('active', 'draft'));

COMMIT;

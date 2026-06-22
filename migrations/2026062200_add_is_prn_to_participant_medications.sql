-- Migration: Add is_prn to participant medications
-- Description: Adds is_prn boolean column to ic_participant_medications with NOT NULL DEFAULT false constraint

BEGIN;

ALTER TABLE public.ic_participant_medications
ADD COLUMN is_prn boolean NOT NULL DEFAULT false;

COMMIT;

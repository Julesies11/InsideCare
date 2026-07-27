-- Migration to add participant kms, participant kms description, and travel kms description to timesheets
-- Created at: 2026-07-09
-- Sequence: 02

ALTER TABLE ic_timesheets
  ADD COLUMN IF NOT EXISTS participant_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS participant_km_description text,
  ADD COLUMN IF NOT EXISTS travel_km_description text;

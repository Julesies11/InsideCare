-- Migration: Add move_in_date to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS move_in_date DATE;

COMMENT ON COLUMN participants.move_in_date IS 'The date the participant moved into the assigned house';

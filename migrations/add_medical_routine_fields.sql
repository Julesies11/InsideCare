-- Migration: Add Medical Routine fields to participants table
-- Date: 2026-02-05

-- Add pharmacy fields
ALTER TABLE participants ADD COLUMN IF NOT EXISTS pharmacy_name TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS pharmacy_contact TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS pharmacy_location TEXT;

-- Add general practitioner fields
ALTER TABLE participants ADD COLUMN IF NOT EXISTS gp_name TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS gp_contact TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS gp_location TEXT;

-- Add psychiatrist fields
ALTER TABLE participants ADD COLUMN IF NOT EXISTS psychiatrist_name TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS psychiatrist_contact TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS psychiatrist_location TEXT;

-- Add additional medical routine fields
ALTER TABLE participants ADD COLUMN IF NOT EXISTS medical_routine_other TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS medical_routine_general_process TEXT;

-- Add comments for documentation
COMMENT ON COLUMN participants.pharmacy_name IS 'Pharmacy name';
COMMENT ON COLUMN participants.pharmacy_contact IS 'Pharmacy contact information';
COMMENT ON COLUMN participants.pharmacy_location IS 'Pharmacy location';
COMMENT ON COLUMN participants.gp_name IS 'General Practitioner name';
COMMENT ON COLUMN participants.gp_contact IS 'General Practitioner contact information';
COMMENT ON COLUMN participants.gp_location IS 'General Practitioner location';
COMMENT ON COLUMN participants.psychiatrist_name IS 'Psychiatrist name';
COMMENT ON COLUMN participants.psychiatrist_contact IS 'Psychiatrist contact information';
COMMENT ON COLUMN participants.psychiatrist_location IS 'Psychiatrist location';
COMMENT ON COLUMN participants.medical_routine_other IS 'Any other medical routine information';
COMMENT ON COLUMN participants.medical_routine_general_process IS 'General medical routine process';

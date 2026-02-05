-- Migration: Add Emergency Management Plan fields to participants table
-- Date: 2026-02-05

-- Add new emergency management fields
ALTER TABLE participants ADD COLUMN IF NOT EXISTS mental_health_plan TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS medical_plan TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS natural_disaster_plan TEXT;

-- Add comments for documentation
COMMENT ON COLUMN participants.mental_health_plan IS 'Mental health management plan and procedures';
COMMENT ON COLUMN participants.medical_plan IS 'Medical emergency plan and procedures';
COMMENT ON COLUMN participants.natural_disaster_plan IS 'Natural disaster and relocation procedures';

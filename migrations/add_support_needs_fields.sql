-- Migration: Add Support Needs fields to participants table
-- Date: 2026-02-05

-- Rename existing fields
ALTER TABLE participants RENAME COLUMN morning_routine TO routine;
ALTER TABLE participants RENAME COLUMN shower_support TO hygiene_support;

-- Add new support fields
ALTER TABLE participants ADD COLUMN IF NOT EXISTS mobility_support TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS meal_prep_support TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS household_support TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS communication_type VARCHAR(20);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS communication_notes TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS communication_language_needs TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS finance_support TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS health_wellbeing_support TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS cultural_religious_support TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS other_support TEXT;

-- Add comments for documentation
COMMENT ON COLUMN participants.routine IS 'Daily routine description (formerly morning_routine)';
COMMENT ON COLUMN participants.hygiene_support IS 'Hygiene support requirements (formerly shower_support)';
COMMENT ON COLUMN participants.mobility_support IS 'Mobility support requirements';
COMMENT ON COLUMN participants.meal_prep_support IS 'Meal preparation and kitchen safety support needs';
COMMENT ON COLUMN participants.household_support IS 'Household tasks support needs';
COMMENT ON COLUMN participants.communication_type IS 'Preferred communication type: verbal or non_verbal';
COMMENT ON COLUMN participants.communication_notes IS 'Notes about communication type preferences';
COMMENT ON COLUMN participants.communication_language_needs IS 'Communication and language needs (tone, validation, etc.)';
COMMENT ON COLUMN participants.finance_support IS 'Financial management support needs';
COMMENT ON COLUMN participants.health_wellbeing_support IS 'Health and wellbeing support needs';
COMMENT ON COLUMN participants.cultural_religious_support IS 'Cultural and religious support needs';
COMMENT ON COLUMN participants.other_support IS 'Any other support needs not covered above';

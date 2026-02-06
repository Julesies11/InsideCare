-- Migration: Modify participant_medications table to use foreign keys
-- Date: 2026-02-06
-- Purpose: Replace medication_name text field with medication_id FK for proper normalization

-- Add new foreign key column
ALTER TABLE participant_medications ADD COLUMN medication_id UUID;

-- Migrate existing data: match text values to master table IDs
UPDATE participant_medications pm
SET medication_id = (
  SELECT id FROM medications_master 
  WHERE LOWER(name) = LOWER(pm.medication_name)
  LIMIT 1
)
WHERE pm.medication_name IS NOT NULL;

-- Drop old text column
ALTER TABLE participant_medications DROP COLUMN medication_name;

-- Add foreign key constraint
ALTER TABLE participant_medications 
  ADD CONSTRAINT participant_medications_medication_id_fkey 
  FOREIGN KEY (medication_id) 
  REFERENCES medications_master(id) 
  ON DELETE RESTRICT;

-- Create index for foreign key
CREATE INDEX idx_participant_medications_medication_id ON participant_medications(medication_id);

-- Update comments
COMMENT ON COLUMN participant_medications.medication_id IS 'Foreign key to medications_master';

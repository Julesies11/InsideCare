-- Migration: Modify participant_funding table
-- Date: 2026-02-06
-- Purpose: Rename fields, add foreign keys for proper normalization

-- Rename columns
ALTER TABLE participant_funding RENAME COLUMN registration_number TO code;
ALTER TABLE participant_funding RENAME COLUMN expiry_date TO end_date;

-- Drop existing CHECK constraints
ALTER TABLE participant_funding DROP CONSTRAINT IF EXISTS participant_funding_funding_source_check;
ALTER TABLE participant_funding DROP CONSTRAINT IF EXISTS participant_funding_funding_type_check;

-- Drop the unique constraint on code (formerly registration_number) since it may not always be unique
ALTER TABLE participant_funding DROP CONSTRAINT IF EXISTS participant_funding_registration_number_key;

-- Add new foreign key columns
ALTER TABLE participant_funding ADD COLUMN funding_source_id UUID;
ALTER TABLE participant_funding ADD COLUMN funding_type_id UUID;

-- Migrate existing data: match text values to master table IDs
UPDATE participant_funding pf
SET funding_source_id = (
  SELECT id FROM funding_sources_master 
  WHERE LOWER(name) = LOWER(pf.funding_source)
  LIMIT 1
)
WHERE pf.funding_source IS NOT NULL;

UPDATE participant_funding pf
SET funding_type_id = (
  SELECT id FROM funding_types_master 
  WHERE LOWER(name) = LOWER(pf.funding_type)
  LIMIT 1
)
WHERE pf.funding_type IS NOT NULL;

-- Drop old text columns
ALTER TABLE participant_funding DROP COLUMN funding_source;
ALTER TABLE participant_funding DROP COLUMN funding_type;

-- Add foreign key constraints
ALTER TABLE participant_funding 
  ADD CONSTRAINT participant_funding_funding_source_id_fkey 
  FOREIGN KEY (funding_source_id) 
  REFERENCES funding_sources_master(id) 
  ON DELETE RESTRICT;

ALTER TABLE participant_funding 
  ADD CONSTRAINT participant_funding_funding_type_id_fkey 
  FOREIGN KEY (funding_type_id) 
  REFERENCES funding_types_master(id) 
  ON DELETE RESTRICT;

-- Create indexes for foreign keys
CREATE INDEX idx_participant_funding_source_id ON participant_funding(funding_source_id);
CREATE INDEX idx_participant_funding_type_id ON participant_funding(funding_type_id);

-- Update comments
COMMENT ON COLUMN participant_funding.code IS 'Funding code (formerly registration_number)';
COMMENT ON COLUMN participant_funding.end_date IS 'Funding end date (formerly expiry_date)';
COMMENT ON COLUMN participant_funding.funding_source_id IS 'Foreign key to funding_sources_master';
COMMENT ON COLUMN participant_funding.funding_type_id IS 'Foreign key to funding_types_master';

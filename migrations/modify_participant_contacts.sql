-- Migration: Modify participant_contacts table to use foreign keys
-- Date: 2026-02-06
-- Purpose: Replace contact_type text field with contact_type_id FK for proper normalization

-- Add new foreign key column
ALTER TABLE participant_contacts ADD COLUMN contact_type_id UUID;

-- Migrate existing data: match text values to master table IDs
UPDATE participant_contacts pc
SET contact_type_id = (
  SELECT id FROM contact_types_master 
  WHERE LOWER(name) = LOWER(pc.contact_type)
  LIMIT 1
)
WHERE pc.contact_type IS NOT NULL;

-- Drop old text column
ALTER TABLE participant_contacts DROP COLUMN contact_type;

-- Add foreign key constraint
ALTER TABLE participant_contacts 
  ADD CONSTRAINT participant_contacts_contact_type_id_fkey 
  FOREIGN KEY (contact_type_id) 
  REFERENCES contact_types_master(id) 
  ON DELETE RESTRICT;

-- Create index for foreign key
CREATE INDEX idx_participant_contacts_contact_type_id ON participant_contacts(contact_type_id);

-- Update comments
COMMENT ON COLUMN participant_contacts.contact_type_id IS 'Foreign key to contact_types_master';

-- Migration: Rename participant_providers to participant_contacts
-- Date: 2026-02-06
-- Purpose: Rename service providers to contacts and add additional contact detail fields

-- Rename the table
ALTER TABLE participant_providers RENAME TO participant_contacts;

-- Rename columns
ALTER TABLE participant_contacts RENAME COLUMN provider_name TO contact_name;
ALTER TABLE participant_contacts RENAME COLUMN provider_type TO contact_type;
ALTER TABLE participant_contacts RENAME COLUMN provider_description TO contact_description;

-- Add new contact detail fields
ALTER TABLE participant_contacts ADD COLUMN phone TEXT;
ALTER TABLE participant_contacts ADD COLUMN email TEXT;
ALTER TABLE participant_contacts ADD COLUMN address TEXT;
ALTER TABLE participant_contacts ADD COLUMN notes TEXT;

-- Drop old indexes
DROP INDEX IF EXISTS idx_providers_participant;
DROP INDEX IF EXISTS idx_providers_active;

-- Create new indexes with updated names
CREATE INDEX idx_contacts_participant ON participant_contacts(participant_id);
CREATE INDEX idx_contacts_active ON participant_contacts(is_active);
CREATE INDEX idx_contacts_type ON participant_contacts(contact_type);

-- Update comments
COMMENT ON TABLE participant_contacts IS 'Contacts associated with participants (formerly service providers)';
COMMENT ON COLUMN participant_contacts.contact_name IS 'Contact name (required)';
COMMENT ON COLUMN participant_contacts.contact_type IS 'Type of contact (required)';
COMMENT ON COLUMN participant_contacts.contact_description IS 'Description of the contact relationship';
COMMENT ON COLUMN participant_contacts.phone IS 'Contact phone number';
COMMENT ON COLUMN participant_contacts.email IS 'Contact email address';
COMMENT ON COLUMN participant_contacts.address IS 'Contact physical address';
COMMENT ON COLUMN participant_contacts.notes IS 'Additional notes about the contact';

-- Migration: Create contact_types_master table
-- Date: 2026-02-06
-- Purpose: Store master list of contact types for searchable dropdown

-- Create contact_types_master table
CREATE TABLE contact_types_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_contact_types_master_name ON contact_types_master(name);
CREATE INDEX idx_contact_types_master_active ON contact_types_master(is_active);

-- Enable Row Level Security
ALTER TABLE contact_types_master ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (all users can add/edit/delete)
CREATE POLICY "Enable all access for authenticated users" ON contact_types_master
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE contact_types_master IS 'Master list of contact types for searchable dropdown';
COMMENT ON COLUMN contact_types_master.name IS 'Contact type name (unique)';
COMMENT ON COLUMN contact_types_master.is_active IS 'Whether contact type is active in dropdown';
COMMENT ON COLUMN contact_types_master.created_by IS 'User who created the contact type';
COMMENT ON COLUMN contact_types_master.updated_by IS 'User who last updated the contact type';

-- Seed common contact types
INSERT INTO contact_types_master (name) VALUES
  ('Service Provider'),
  ('Allied Health Professional'),
  ('Emergency contact'),
  ('Guardian'),
  ('Power of Attorney'),
  ('Other');

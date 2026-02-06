-- Migration: Create funding_types_master table
-- Date: 2026-02-06
-- Purpose: Store master list of funding types for searchable dropdown

-- Create funding_types_master table
CREATE TABLE funding_types_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_funding_types_master_name ON funding_types_master(name);
CREATE INDEX idx_funding_types_master_active ON funding_types_master(is_active);

-- Enable Row Level Security
ALTER TABLE funding_types_master ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (all users can add/edit/delete)
CREATE POLICY "Enable all access for authenticated users" ON funding_types_master
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE funding_types_master IS 'Master list of funding types for searchable dropdown';
COMMENT ON COLUMN funding_types_master.name IS 'Funding type name (unique)';
COMMENT ON COLUMN funding_types_master.is_active IS 'Whether funding type is active in dropdown';
COMMENT ON COLUMN funding_types_master.created_by IS 'User who created the funding type';
COMMENT ON COLUMN funding_types_master.updated_by IS 'User who last updated the funding type';

-- Seed common funding types
INSERT INTO funding_types_master (name) VALUES
  ('SIL'),
  ('ILO'),
  ('Core'),
  ('IRS');

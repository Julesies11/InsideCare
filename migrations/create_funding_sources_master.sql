-- Migration: Create funding_sources_master table
-- Date: 2026-02-06
-- Purpose: Store master list of funding sources for searchable dropdown

-- Create funding_sources_master table
CREATE TABLE funding_sources_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_funding_sources_master_name ON funding_sources_master(name);
CREATE INDEX idx_funding_sources_master_active ON funding_sources_master(is_active);

-- Enable Row Level Security
ALTER TABLE funding_sources_master ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (all users can add/edit/delete)
CREATE POLICY "Enable all access for authenticated users" ON funding_sources_master
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE funding_sources_master IS 'Master list of funding sources for searchable dropdown';
COMMENT ON COLUMN funding_sources_master.name IS 'Funding source name (unique)';
COMMENT ON COLUMN funding_sources_master.is_active IS 'Whether funding source is active in dropdown';
COMMENT ON COLUMN funding_sources_master.created_by IS 'User who created the funding source';
COMMENT ON COLUMN funding_sources_master.updated_by IS 'User who last updated the funding source';

-- Seed common funding sources
INSERT INTO funding_sources_master (name) VALUES
  ('NDIS'),
  ('Plan'),
  ('Other');

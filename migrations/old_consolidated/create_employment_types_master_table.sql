-- Migration: Create employment_types_master table
-- Date: 2026-02-08
-- Purpose: Master list of employment types (Full-time, Part-time, Contract, etc.)

CREATE TABLE IF NOT EXISTS public.employment_types_master (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT employment_types_master_pkey PRIMARY KEY (id)
);

-- Create index for name lookups
CREATE INDEX IF NOT EXISTS idx_employment_types_master_name ON public.employment_types_master USING btree (name);

-- Add comments
COMMENT ON TABLE public.employment_types_master IS 'Master list of employment types (Full-time, Part-time, Contract, etc.)';
COMMENT ON COLUMN public.employment_types_master.name IS 'Employment type name';
COMMENT ON COLUMN public.employment_types_master.description IS 'Employment type description';
COMMENT ON COLUMN public.employment_types_master.status IS 'Active or Inactive';

-- Seed data
INSERT INTO public.employment_types_master (name, description, status) VALUES
  ('Full-time', 'Full-time employment', 'Active'),
  ('Part-time', 'Part-time employment', 'Active'),
  ('Contract', 'Contract-based employment', 'Active'),
  ('Temporary', 'Temporary employment', 'Active'),
  ('Casual', 'Casual employment', 'Active')
ON CONFLICT DO NOTHING;

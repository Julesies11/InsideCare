-- Migration: Create departments table
-- Date: 2026-02-08
-- Purpose: Master list of departments for staff organization

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  access_level TEXT NULL DEFAULT 'Limited',
  status TEXT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);

-- Create index for name lookups
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments USING btree (name);

-- Add comments
COMMENT ON TABLE public.departments IS 'Master list of departments for staff organization';
COMMENT ON COLUMN public.departments.name IS 'Department name';
COMMENT ON COLUMN public.departments.description IS 'Department description';
COMMENT ON COLUMN public.departments.access_level IS 'Access level for department';
COMMENT ON COLUMN public.departments.status IS 'Active or Inactive';

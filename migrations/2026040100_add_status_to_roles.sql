-- Migration: Add status to roles table
-- Date: 2026-04-01
-- Description: Adds a boolean is_active column to allow soft-deactivation of roles.

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Ensure all existing roles are active
UPDATE public.roles SET is_active = true WHERE is_active IS NULL;

COMMENT ON COLUMN public.roles.is_active IS 'Whether the role is available for selection in dropdowns.';

-- Migration: Fix Shift Assigned Checklists Schema
-- Date: 2026-03-24
-- Description: Adds missing columns to link routines to houses and shift types directly.

-- 1. Add House ID and Shift Type ID to the mapping table
ALTER TABLE public.shift_assigned_checklists ADD COLUMN IF NOT EXISTS house_id uuid REFERENCES public.houses(id) ON DELETE CASCADE;
ALTER TABLE public.shift_assigned_checklists ADD COLUMN IF NOT EXISTS shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE CASCADE;

-- 2. Make shift_id nullable (as it can now be a template rule OR a specific roster link)
ALTER TABLE public.shift_assigned_checklists ALTER COLUMN shift_id DROP NOT NULL;

-- 3. Update comments
COMMENT ON COLUMN public.shift_assigned_checklists.shift_id IS 'If NULL, this is a routine rule for all shifts of a specific type in a house.';
COMMENT ON COLUMN public.shift_assigned_checklists.shift_type_id IS 'Links the routine to a dynamic house shift type (Morning, Night, etc).';

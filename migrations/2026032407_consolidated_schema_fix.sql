-- Migration: Consolidated Roster & Checklist Schema Fix (V2 - Clean)
-- Date: 2026-03-24
-- Description: Ensures all required columns for Roster, Setup Tracking, and Checklist Re-ordering exist.

-- 1. Staff Shifts Table (Open Shifts)
DO $$
BEGIN
  -- Enable Open Shifts by making staff_id nullable
  ALTER TABLE public.staff_shifts ALTER COLUMN staff_id DROP NOT NULL;
END $$;

-- 2. Shift Assigned Checklists (Routine Mapping)
DO $$
BEGIN
  -- Add House ID and Shift Type ID to the mapping table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assigned_checklists' AND column_name = 'house_id') THEN
    ALTER TABLE public.shift_assigned_checklists ADD COLUMN house_id uuid REFERENCES public.houses(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assigned_checklists' AND column_name = 'shift_type_id') THEN
    ALTER TABLE public.shift_assigned_checklists ADD COLUMN shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE CASCADE;
  END IF;
  
  -- Ensure shift_id is nullable for template routines (rules applied to shift types)
  ALTER TABLE public.shift_assigned_checklists ALTER COLUMN shift_id DROP NOT NULL;
END $$;

-- 3. Houses Table (Setup Tracking)
DO $$
BEGIN
  -- Add setup progress tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'setup_step') THEN
    ALTER TABLE public.houses ADD COLUMN setup_step integer NOT NULL DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'is_configured') THEN
    ALTER TABLE public.houses ADD COLUMN is_configured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. House Checklists (Re-ordering)
DO $$
BEGIN
  -- Add sort_order for manual checklist organization
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'house_checklists' AND column_name = 'sort_order') THEN
    ALTER TABLE public.house_checklists ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

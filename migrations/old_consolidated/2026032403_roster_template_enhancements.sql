-- Migration: Roster & Shift Template Enhancements
-- Date: 2026-03-24
-- Description: Enables Open Shifts and adds default timing to shift types.

-- 1. Enable Open Shifts (Nullable Staff ID)
ALTER TABLE public.staff_shifts ALTER COLUMN staff_id DROP NOT NULL;

-- 2. Add default times to Shift Types
ALTER TABLE public.house_shift_types ADD COLUMN IF NOT EXISTS default_start_time time without time zone;
ALTER TABLE public.house_shift_types ADD COLUMN IF NOT EXISTS default_end_time time without time zone;

-- 3. Populate default times for standard shifts
UPDATE public.house_shift_types SET default_start_time = '07:00:00', default_end_time = '15:00:00' WHERE name = 'Morning';
UPDATE public.house_shift_types SET default_start_time = '15:00:00', default_end_time = '23:00:00' WHERE name = 'Day';
UPDATE public.house_shift_types SET default_start_time = '23:00:00', default_end_time = '07:00:00' WHERE name = 'Night';

-- 4. Ensure junction table uses dynamic IDs
-- (The shift_assigned_checklists table already exists, ensuring it handles the mapping)

COMMENT ON COLUMN public.staff_shifts.staff_id IS 'If NULL, this is an Open Shift available for assignment.';
COMMENT ON COLUMN public.house_shift_types.default_start_time IS 'Used to auto-populate the roster skeleton.';

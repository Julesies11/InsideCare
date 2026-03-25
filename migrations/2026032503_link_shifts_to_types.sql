-- Migration: Link Staff Shifts to Shift Types
-- Date: 2026-03-25
-- Description: Adds a formal foreign key from staff_shifts to house_shift_types for dynamic styling.

-- 1. Add the column
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;

-- 2. Backfill existing shifts based on name matching
DO $$
BEGIN
    UPDATE public.staff_shifts ss
    SET shift_type_id = hst.id
    FROM public.house_shift_types hst
    WHERE ss.house_id = hst.house_id
    AND ss.shift_type = hst.name
    AND ss.shift_type_id IS NULL;
END $$;

-- 3. Comment for documentation
COMMENT ON COLUMN public.staff_shifts.shift_type_id IS 'Link to the dynamic shift model for icons and colors.';

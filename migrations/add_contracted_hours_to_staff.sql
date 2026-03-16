-- Migration: Add contracted_hours to staff table
-- Date: 2026-03-15

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'contracted_hours') THEN
    ALTER TABLE public.staff ADD COLUMN contracted_hours numeric(5, 2) DEFAULT 0.00;
    COMMENT ON COLUMN public.staff.contracted_hours IS 'Number of hours contracted per fortnight';
  END IF;
END $$;

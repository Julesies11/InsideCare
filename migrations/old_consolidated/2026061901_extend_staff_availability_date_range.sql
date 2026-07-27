-- Migration: 2026061901_extend_staff_availability_date_range.sql
-- Description: Extends staff availability exceptions to support date ranges (start_date to end_date).
-- Author: Senior Full Stack Developer (Antigravity)

BEGIN;

-- Rename specific_date to start_date
ALTER TABLE public.ic_staff_availability RENAME COLUMN specific_date TO start_date;

-- Add end_date column
ALTER TABLE public.ic_staff_availability ADD COLUMN end_date date;

-- Populate end_date with start_date for existing date_specific records to prevent constraint check failures
UPDATE public.ic_staff_availability
SET end_date = start_date
WHERE type = 'date_specific' AND end_date IS NULL;

-- Drop old check constraint
ALTER TABLE public.ic_staff_availability DROP CONSTRAINT IF EXISTS check_conditional_fields;

-- Add new check constraint to support ranges for date_specific exceptions
ALTER TABLE public.ic_staff_availability ADD CONSTRAINT check_conditional_fields CHECK (
    (type = 'recurring' AND day_of_week IS NOT NULL AND start_date IS NULL AND end_date IS NULL) OR
    (type = 'date_specific' AND start_date IS NOT NULL AND end_date IS NOT NULL AND day_of_week IS NULL)
);

-- Add date order check constraint
ALTER TABLE public.ic_staff_availability ADD CONSTRAINT check_date_order CHECK (
    start_date IS NULL OR end_date IS NULL OR end_date >= start_date
);

-- Drop old index and recreate with start_date and end_date
DROP INDEX IF EXISTS idx_staff_availability_lookup;
CREATE INDEX idx_staff_availability_lookup ON public.ic_staff_availability(type, start_date, end_date, day_of_week) WHERE is_active = true;

COMMIT;

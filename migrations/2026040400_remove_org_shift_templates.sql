-- Migration: Remove Organization Level Shift Templates
-- Date: 2026-04-04
-- Description: Removes org_shift_templates and related links as the system now uses House Shift templates/modes exclusively.

-- 1. Remove the foreign key column from staff_shifts
ALTER TABLE public.staff_shifts DROP COLUMN IF EXISTS org_shift_template_id;

-- 2. Drop the linking table
DROP TABLE IF EXISTS public.org_shift_template_checklists CASCADE;

-- 3. Drop the master templates table
DROP TABLE IF EXISTS public.org_shift_templates CASCADE;

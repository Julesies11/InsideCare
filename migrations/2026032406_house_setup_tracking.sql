-- Migration: House Setup Progress Tracking
-- Date: 2026-03-24
-- Description: Adds persistent progress tracking for the House Setup Wizard.

-- 1. Add progress tracking columns
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS setup_step integer NOT NULL DEFAULT 1;
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS is_configured boolean NOT NULL DEFAULT false;

-- 2. Add comments for documentation
COMMENT ON COLUMN public.houses.setup_step IS 'The last completed or current step in the 5-step Setup Wizard.';
COMMENT ON COLUMN public.houses.is_configured IS 'When true, the house is considered operational and visible to staff.';

-- 3. Initial check: If a house already has checklists or shifts, mark it as step 5 / configured
-- This prevents the wizard from popping up for existing, established houses.
UPDATE public.houses 
SET setup_step = 5, is_configured = true
WHERE id IN (SELECT house_id FROM public.house_checklists)
OR id IN (SELECT house_id FROM public.staff_shifts);

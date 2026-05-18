-- Migration: Remove frequency column from checklists
-- Description: The frequency column is redundant as scheduling is now handled via Path A (House Calendar) or Path B (Shift Routines).

ALTER TABLE public.checklist_master DROP COLUMN IF EXISTS frequency;
ALTER TABLE public.house_checklists DROP COLUMN IF EXISTS frequency;

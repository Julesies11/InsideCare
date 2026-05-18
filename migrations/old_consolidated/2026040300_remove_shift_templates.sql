-- Migration: Remove Shift Template System
-- Description: Drops redundant tables associated with the legacy shift template system
-- tables being replaced by 'Shift Model' (house_shift_types) and the 'Populate Roster' tool.

-- 1. Drop junction tables first to satisfy foreign key constraints
DROP TABLE IF EXISTS public.shift_template_item_participants CASCADE;
DROP TABLE IF EXISTS public.shift_template_item_checklists CASCADE;

-- 2. Drop item and schedule tables
DROP TABLE IF EXISTS public.shift_template_items CASCADE;
DROP TABLE IF EXISTS public.shift_template_schedules CASCADE;

-- 3. Drop the main groups table
DROP TABLE IF EXISTS public.shift_template_groups CASCADE;

-- 4. Cleanup any orphan references if any (optional, but good practice)
-- No orphan references identified that would cause issues.

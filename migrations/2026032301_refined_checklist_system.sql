-- Migration: Refined Checklist System (Consolidated)
-- Date: 2026-03-23
-- Description: Merges type/shift targeting and NOT NULL enforcement

-- 1. Create Enums for Types and Shifts
DO $$ BEGIN
    CREATE TYPE public.checklist_type_enum AS ENUM ('daily_house', 'start_of_shift', 'end_of_shift');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_period_enum AS ENUM ('morning', 'day', 'night', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update checklist_master
ALTER TABLE public.checklist_master
ADD COLUMN IF NOT EXISTS type public.checklist_type_enum NOT NULL DEFAULT 'daily_house',
ADD COLUMN IF NOT EXISTS target_shift public.shift_period_enum NOT NULL DEFAULT 'all';

-- 3. Update house_checklists
ALTER TABLE public.house_checklists
ADD COLUMN IF NOT EXISTS type public.checklist_type_enum NOT NULL DEFAULT 'daily_house',
ADD COLUMN IF NOT EXISTS target_shift public.shift_period_enum NOT NULL DEFAULT 'all';

-- 4. Update checklist_item_master
-- Add group_title if not exists, then backfill, then set NOT NULL
ALTER TABLE public.checklist_item_master ADD COLUMN IF NOT EXISTS group_title text NULL;
UPDATE public.checklist_item_master SET group_title = 'Morning' WHERE group_title IS NULL;
ALTER TABLE public.checklist_item_master ALTER COLUMN group_title SET NOT NULL;

-- Add constraint for allowed values
ALTER TABLE public.checklist_item_master DROP CONSTRAINT IF EXISTS checklist_item_master_group_title_check;
ALTER TABLE public.checklist_item_master ADD CONSTRAINT checklist_item_master_group_title_check 
CHECK (group_title IN ('Morning', 'Day', 'Night'));

-- 5. Update house_checklist_items
-- Add group_title if not exists, then backfill, then set NOT NULL
ALTER TABLE public.house_checklist_items ADD COLUMN IF NOT EXISTS group_title text NULL;
UPDATE public.house_checklist_items SET group_title = 'Morning' WHERE group_title IS NULL;
ALTER TABLE public.house_checklist_items ALTER COLUMN group_title SET NOT NULL;

-- Add constraint for allowed values
ALTER TABLE public.house_checklist_items DROP CONSTRAINT IF EXISTS house_checklist_items_group_title_check;
ALTER TABLE public.house_checklist_items ADD CONSTRAINT house_checklist_items_group_title_check 
CHECK (group_title IN ('Morning', 'Day', 'Night'));

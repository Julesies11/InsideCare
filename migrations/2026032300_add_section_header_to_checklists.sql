-- Migration: Add group_title to checklist items
-- Date: 2026-03-23

-- Add group_title to checklist_item_master
ALTER TABLE public.checklist_item_master
ADD COLUMN IF NOT EXISTS group_title text NULL;

-- Add group_title to house_checklist_items
ALTER TABLE public.house_checklist_items
ADD COLUMN IF NOT EXISTS group_title text NULL;

-- Migration: Add sort_order to house_checklists
-- Date: 2026-03-24
-- Description: Adds a sort_order column to allow manual re-ordering of checklists within a house.

ALTER TABLE public.house_checklists ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.house_checklists.sort_order IS 'Determines the display order of checklists in the House Setup UI.';

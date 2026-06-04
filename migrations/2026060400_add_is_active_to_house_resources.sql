-- Migration: Add is_active to ic_house_resources
-- Date: 2026-06-04
-- Description: Adds a soft delete capability to house resources.

ALTER TABLE public.ic_house_resources
ADD COLUMN is_active boolean DEFAULT true;

-- Update existing records to be active
UPDATE public.ic_house_resources SET is_active = true WHERE is_active IS NULL;

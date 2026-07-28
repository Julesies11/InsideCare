-- Migration: Add clinical tracker toggles to public.ic_participants
-- Date: 2026-06-08

ALTER TABLE public.ic_participants
ADD COLUMN IF NOT EXISTS track_bowel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_seizure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_sleep BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_behaviour BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_community BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_nutrition BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_mtm BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_hygiene BOOLEAN DEFAULT false;

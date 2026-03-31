-- Migration: Rename shift_date to start_date in staff_shifts
-- Date: 2026-03-29
-- Description: Standardizing column names for clarity before go-live.

ALTER TABLE public.staff_shifts RENAME COLUMN shift_date TO start_date;
ALTER TABLE public.shift_notes RENAME COLUMN shift_date TO start_date;

-- Update the index name as well for consistency
ALTER INDEX IF EXISTS idx_staff_shifts_date RENAME TO idx_staff_shifts_start_date;
ALTER INDEX IF EXISTS idx_shift_notes_shift_date RENAME TO idx_shift_notes_start_date;

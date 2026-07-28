-- Migration: Refactor Incident Report Columns
-- Date: 2026-06-04
-- Objective: Make legacy columns nullable to support the new structured incident reporting format.

-- 1. Make legacy columns nullable
ALTER TABLE public.ic_incident_reports 
    ALTER COLUMN incident_type DROP NOT NULL,
    ALTER COLUMN description DROP NOT NULL,
    -- Also ensure status is nullable if we are moving to admin_status
    ALTER COLUMN status DROP NOT NULL;

-- 2. Data Migration (Optional: Sync legacy data to new columns for existing records)
UPDATE public.ic_incident_reports
SET 
    summary = COALESCE(summary, SUBSTR(description, 1, 100)),
    details = COALESCE(details, description)
WHERE details IS NULL AND description IS NOT NULL;

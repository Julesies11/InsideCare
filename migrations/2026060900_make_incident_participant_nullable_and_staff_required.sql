-- Migration: Make incident participant nullable and staff (witnessed by) mandatory
-- Date: 2026-06-09
-- Sequence: 00

-- 1. Make involved_participant_id nullable (DROP NOT NULL constraint)
ALTER TABLE public.ic_incident_reports 
  ALTER COLUMN involved_participant_id DROP NOT NULL;

-- 2. Backfill any existing records where involved_staff_id is null with reported_by to prevent migration failure
UPDATE public.ic_incident_reports 
  SET involved_staff_id = reported_by 
  WHERE involved_staff_id IS NULL;

-- 3. Make involved_staff_id mandatory (SET NOT NULL constraint)
ALTER TABLE public.ic_incident_reports 
  ALTER COLUMN involved_staff_id SET NOT NULL;

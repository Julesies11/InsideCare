-- Migration: Add Timesheet Unique Constraint
-- Date: 2026-05-25
-- Description: Adds a unique constraint to ic_timesheets on (shift_id, staff_id) to support upsert operations.

ALTER TABLE public.ic_timesheets
ADD CONSTRAINT ic_timesheets_shift_staff_key UNIQUE (shift_id, staff_id);

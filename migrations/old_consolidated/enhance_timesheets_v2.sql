-- Enhance timesheets table for full Timesheet & Shift Notes module v2
-- Run this migration against your Supabase project

-- 1. Add new columns
ALTER TABLE timesheets
  ADD COLUMN IF NOT EXISTS actual_start          timestamptz,
  ADD COLUMN IF NOT EXISTS actual_end            timestamptz,
  ADD COLUMN IF NOT EXISTS overtime_hours        numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_explanation  text,
  ADD COLUMN IF NOT EXISTS travel_km             numeric(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incident_tag          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sick_shift            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shift_notes_text      text,
  ADD COLUMN IF NOT EXISTS submitted_at          timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason      text,
  ADD COLUMN IF NOT EXISTS approved_at           timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by           uuid REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS late_submission       boolean NOT NULL DEFAULT false;

-- 2. Widen status to include 'draft'
--    draft    = autosaved / not yet submitted
--    pending  = submitted, awaiting admin approval
--    approved = admin approved
--    rejected = admin rejected
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_status_check;
ALTER TABLE timesheets ADD CONSTRAINT timesheets_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- 3. Backfill actual_start / actual_end from existing clock_in / clock_out
UPDATE timesheets
SET actual_start = clock_in,
    actual_end   = clock_out
WHERE actual_start IS NULL;

-- 4. Backfill submitted_at for already-submitted rows
UPDATE timesheets
SET submitted_at = created_at
WHERE status IN ('pending', 'approved', 'rejected')
  AND submitted_at IS NULL;

-- 5. Prevent duplicate timesheets per shift per staff member
ALTER TABLE timesheets
  DROP CONSTRAINT IF EXISTS timesheets_shift_staff_unique;
ALTER TABLE timesheets
  ADD CONSTRAINT timesheets_shift_staff_unique UNIQUE (shift_id, staff_id);

-- 6. Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_timesheets_submitted_at  ON timesheets(submitted_at);
CREATE INDEX IF NOT EXISTS idx_timesheets_incident_tag  ON timesheets(incident_tag) WHERE incident_tag = true;
CREATE INDEX IF NOT EXISTS idx_timesheets_sick_shift     ON timesheets(sick_shift)   WHERE sick_shift   = true;

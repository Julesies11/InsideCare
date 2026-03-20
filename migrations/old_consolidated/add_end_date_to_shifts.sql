-- Add end_date to staff_shifts to support overnight shifts
-- shift_date remains the START date; end_date is the END date (defaults to same day)
ALTER TABLE staff_shifts
  ADD COLUMN IF NOT EXISTS end_date date;

-- Backfill: existing shifts end on the same day they start
UPDATE staff_shifts SET end_date = shift_date WHERE end_date IS NULL;

-- Make it NOT NULL now that it's backfilled
ALTER TABLE staff_shifts ALTER COLUMN end_date SET NOT NULL;
ALTER TABLE staff_shifts ALTER COLUMN end_date SET DEFAULT CURRENT_DATE;

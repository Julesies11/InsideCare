-- Add risk_management column to ic_houses table
ALTER TABLE public.ic_houses ADD COLUMN IF NOT EXISTS risk_management text;

-- Update the activity log trigger to include risk_management if necessary (usually handled by * or row level)
-- No further action needed if the trigger uses old/new row records.

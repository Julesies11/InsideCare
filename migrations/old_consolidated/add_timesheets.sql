-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES staff_shifts(id) ON DELETE SET NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz NOT NULL,
  break_minutes integer NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timesheets_staff_id ON timesheets(staff_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_shift_id ON timesheets(shift_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);

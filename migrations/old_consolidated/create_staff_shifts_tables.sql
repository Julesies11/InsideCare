-- Create staff_shifts table
CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME(0) NOT NULL,
  end_time TIME(0) NOT NULL,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  shift_type VARCHAR(50) NOT NULL DEFAULT 'SIL',
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shift_participants junction table
CREATE TABLE IF NOT EXISTS shift_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES staff_shifts(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, participant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_house_id ON staff_shifts(house_id);
CREATE INDEX IF NOT EXISTS idx_shift_participants_shift_id ON shift_participants(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_participants_participant_id ON shift_participants(participant_id);

-- Add comments for documentation
COMMENT ON TABLE staff_shifts IS 'Stores staff shift schedules and roster information';
COMMENT ON COLUMN staff_shifts.staff_id IS 'Reference to the staff member assigned to this shift';
COMMENT ON COLUMN staff_shifts.shift_date IS 'Date of the shift';
COMMENT ON COLUMN staff_shifts.start_time IS 'Shift start time';
COMMENT ON COLUMN staff_shifts.end_time IS 'Shift end time';
COMMENT ON COLUMN staff_shifts.house_id IS 'Reference to the house/location for this shift';
COMMENT ON COLUMN staff_shifts.shift_type IS 'Type of shift: SIL, Community, Admin, etc.';
COMMENT ON COLUMN staff_shifts.status IS 'Shift status: Scheduled, Completed, Cancelled, No Show';
COMMENT ON COLUMN staff_shifts.notes IS 'Additional notes about the shift';

COMMENT ON TABLE shift_participants IS 'Links shifts to participants being supported';
COMMENT ON COLUMN shift_participants.shift_id IS 'Reference to the shift';
COMMENT ON COLUMN shift_participants.participant_id IS 'Reference to the participant';

-- Enable Row Level Security
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff_shifts (allow public access)
CREATE POLICY "Allow all users to view staff_shifts"
  ON staff_shifts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert staff_shifts"
  ON staff_shifts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update staff_shifts"
  ON staff_shifts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete staff_shifts"
  ON staff_shifts FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create RLS policies for shift_participants (allow public access)
CREATE POLICY "Allow all users to view shift_participants"
  ON shift_participants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert shift_participants"
  ON shift_participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update shift_participants"
  ON shift_participants FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete shift_participants"
  ON shift_participants FOR DELETE
  TO anon, authenticated
  USING (true);

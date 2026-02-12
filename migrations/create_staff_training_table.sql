-- Create staff_training table to replace staff_resources
-- This table stores training records for staff members with document upload capability

CREATE TABLE staff_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  date_completed DATE,
  expiry_date DATE,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_staff_training_staff_id ON staff_training(staff_id);
CREATE INDEX idx_staff_training_expiry_date ON staff_training(expiry_date);
CREATE INDEX idx_staff_training_created_at ON staff_training(created_at DESC);

-- Enable Row Level Security
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON staff_training
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON staff_training
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON staff_training
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON staff_training
  FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE staff_training IS 'Stores training records for staff members including completion dates, expiry dates, and uploaded documents';
COMMENT ON COLUMN staff_training.staff_id IS 'Reference to the staff member (optional for general training resources)';
COMMENT ON COLUMN staff_training.title IS 'Title of the training';
COMMENT ON COLUMN staff_training.category IS 'Category of the training (e.g., Safety, Policy, Clinical)';
COMMENT ON COLUMN staff_training.provider IS 'Training provider or organization';
COMMENT ON COLUMN staff_training.date_completed IS 'Date when the training was completed';
COMMENT ON COLUMN staff_training.expiry_date IS 'Date when the training expires (optional)';
COMMENT ON COLUMN staff_training.file_path IS 'Path to the uploaded training document in Supabase Storage';
COMMENT ON COLUMN staff_training.file_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN staff_training.file_size IS 'Size of the uploaded file in bytes';

-- Drop old staff_resources table if it exists
DROP TABLE IF EXISTS staff_resources CASCADE;

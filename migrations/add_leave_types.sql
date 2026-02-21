-- Create leave_types lookup table
CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default leave types
INSERT INTO leave_types (name) VALUES
  ('Annual Leave'),
  ('Sick Leave'),
  ('Personal Leave')
ON CONFLICT (name) DO NOTHING;

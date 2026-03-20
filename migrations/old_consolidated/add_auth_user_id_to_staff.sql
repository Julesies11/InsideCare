-- Add auth_user_id to staff table to link Supabase auth users to staff records
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON staff(auth_user_id);

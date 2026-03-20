-- Fix shift_notes table with unique constraint for upsert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'shift_notes_shift_staff_unique'
    ) THEN
        ALTER TABLE public.shift_notes ADD CONSTRAINT shift_notes_shift_staff_unique UNIQUE (shift_id, staff_id);
    END IF;
END $$;

-- Update activity_log table to be more flexible
-- 1. Remove the restrictive activity_type check constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_activity_type_check'
    ) THEN
        ALTER TABLE public.activity_log DROP CONSTRAINT activity_log_activity_type_check;
    END IF;
END $$;

-- 2. Change entity_id to text to allow for more flexibility if needed (though UUID is fine for now, many systems use string IDs)
-- We'll keep it as UUID if the user prefers, but usually text is safer for a generic activity log.
-- Given the error was 400, let's keep it as text to match the common pattern in the app.
ALTER TABLE public.activity_log ALTER COLUMN entity_id TYPE text;

-- 3. Ensure description can be null if needed (the app logger handles this but good to be safe)
ALTER TABLE public.activity_log ALTER COLUMN description DROP NOT NULL;

-- Fix notifications insert policy to allow staff to notify admins
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable and add RLS policies for shift_notes
ALTER TABLE shift_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to shift_notes" ON shift_notes;
CREATE POLICY "Admins have full access to shift_notes"
  ON shift_notes FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

DROP POLICY IF EXISTS "Staff can read all shift notes" ON shift_notes;
CREATE POLICY "Staff can read all shift notes"
  ON shift_notes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can create shift notes" ON shift_notes;
CREATE POLICY "Staff can create shift notes"
  ON shift_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update own shift notes" ON shift_notes;
CREATE POLICY "Staff can update own shift notes"
  ON shift_notes FOR UPDATE
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Enable and add RLS policies for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read activity log" ON activity_log;
CREATE POLICY "Authenticated users can read activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert activity log" ON activity_log;
CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

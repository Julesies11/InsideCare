-- Migration: Add RLS policies for shift_participants
-- Description: Standard staff members need access to the shift_participants junction table to view and manage participants on shifts.

ALTER TABLE public.shift_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins full access" ON public.shift_participants;

CREATE POLICY "Allow all users to view shift_participants"
  ON public.shift_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all users to insert shift_participants"
  ON public.shift_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to delete shift_participants"
  ON public.shift_participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow all users to update shift_participants"
  ON public.shift_participants FOR UPDATE TO authenticated USING (true);
-- Fix Timesheets RLS: Allow staff to update their own timesheet records (drafts/pending)
-- This is required for both the autosave feature and final submission if a draft exists.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timesheets' 
        AND policyname = 'Staff can update own timesheets'
    ) THEN
        CREATE POLICY "Staff can update own timesheets"
          ON public.timesheets FOR UPDATE
          TO authenticated
          USING (
            staff_id IN (
              SELECT id FROM staff WHERE auth_user_id = auth.uid()
            )
          );
    END IF;
END $$;

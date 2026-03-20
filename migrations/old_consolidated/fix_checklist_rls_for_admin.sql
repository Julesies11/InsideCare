-- Fix RLS for house_checklist_submissions to include explicit admin access check
-- Even if Admins have a global policy, the Staff policy might be more restrictive or failing due to missing assignments

-- Drop existing restrictive policies if necessary (optional, but cleaner)
DROP POLICY IF EXISTS "Admins have full access to house_checklist_submissions" ON public.house_checklist_submissions;
DROP POLICY IF EXISTS "Staff can manage checklist submissions for assigned houses" ON public.house_checklist_submissions;

-- 1. Explicit Admin Policy (Check metadata)
CREATE POLICY "Admins have full access to house_checklist_submissions"
  ON public.house_checklist_submissions FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- 2. Staff Policy (House assignment check)
CREATE POLICY "Staff can manage checklist submissions for assigned houses"
  ON public.house_checklist_submissions FOR ALL
  TO authenticated
  USING (
    house_id IN (
      SELECT hsa.house_id 
      FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    house_id IN (
      SELECT hsa.house_id 
      FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  );

-- Repeat for submission items
DROP POLICY IF EXISTS "Admins have full access to house_checklist_submission_items" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "Staff can manage checklist submission items for assigned houses" ON public.house_checklist_submission_items;

CREATE POLICY "Admins have full access to house_checklist_submission_items"
  ON public.house_checklist_submission_items FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "Staff can manage checklist submission items for assigned houses"
  ON public.house_checklist_submission_items FOR ALL
  TO authenticated
  USING (
    submission_id IN (
      SELECT hcs.id 
      FROM public.house_checklist_submissions hcs
      JOIN public.house_staff_assignments hsa ON hsa.house_id = hcs.house_id
      JOIN public.staff s ON s.id = hsa.staff_id
      WHERE s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    submission_id IN (
      SELECT hcs.id 
      FROM public.house_checklist_submissions hcs
      JOIN public.house_staff_assignments hsa ON hsa.house_id = hcs.house_id
      JOIN public.staff s ON s.id = hsa.staff_id
      WHERE s.auth_user_id = auth.uid()
    )
  );

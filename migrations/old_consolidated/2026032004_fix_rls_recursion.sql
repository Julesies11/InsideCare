-- ========================================================================================
-- RLS RECURSION & PERMISSION FIX 2026-03-20
-- Objective: 
-- 1. Eliminate infinite recursion in house_staff_assignments.
-- 2. Restore Staff access to House and Checklist systems.
-- 3. Refine permissions (removing Staff DELETE access where inappropriate).
-- ========================================================================================

-- 1. FIX HOUSE_STAFF_ASSIGNMENTS (The recursion root)
-- We allow all authenticated users to read assignments. This is safe and allows
-- other RLS policies to use this table as a lookup without recursive loops.
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select coworkers in same houses" ON public.house_staff_assignments;
DROP POLICY IF EXISTS "Staff can select own house assignments" ON public.house_staff_assignments;
DROP POLICY IF EXISTS "Authenticated users select assignments" ON public.house_staff_assignments;

CREATE POLICY "Staff select assignments lookup" ON public.house_staff_assignments 
  FOR SELECT TO authenticated 
  USING (true);

-- 2. REFINE HOUSE CHECKLIST PERMISSIONS
-- Staff should see checklists and items for their houses, but not modify the templates.
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned house checklists" ON public.house_checklists;

CREATE POLICY "Staff select assigned house checklists" ON public.house_checklists 
  FOR SELECT TO authenticated 
  USING (house_id IN (
    SELECT house_id FROM public.house_staff_assignments hsa 
    JOIN public.staff s ON s.id = hsa.staff_id 
    WHERE s.auth_user_id = auth.uid()
  ));

-- 3. REFINE CHECKLIST SUBMISSION PERMISSIONS
-- Staff can manage submissions, items, and attachments for their assigned houses.
-- We use SELECT/INSERT/UPDATE instead of ALL to prevent DELETE.

-- Submissions
ALTER TABLE public.house_checklist_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned checklist submissions" ON public.house_checklist_submissions;

CREATE POLICY "Staff select assigned house submissions" ON public.house_checklist_submissions 
  FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff insert assigned house submissions" ON public.house_checklist_submissions 
  FOR INSERT TO authenticated 
  WITH CHECK (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff update assigned house submissions" ON public.house_checklist_submissions 
  FOR UPDATE TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- Submission Items
ALTER TABLE public.house_checklist_submission_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned submission items" ON public.house_checklist_submission_items;

CREATE POLICY "Staff select assigned submission items" ON public.house_checklist_submission_items 
  FOR SELECT TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff insert assigned submission items" ON public.house_checklist_submission_items 
  FOR INSERT TO authenticated 
  WITH CHECK (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff update assigned submission items" ON public.house_checklist_submission_items 
  FOR UPDATE TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

-- 4. REFINE HOUSE CALENDAR PERMISSIONS
-- Staff can see and create events, but not delete them.
ALTER TABLE public.house_calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned house calendar events" ON public.house_calendar_events;

CREATE POLICY "Staff select assigned house events" ON public.house_calendar_events 
  FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff insert assigned house events" ON public.house_calendar_events 
  FOR INSERT TO authenticated 
  WITH CHECK (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff update assigned house events" ON public.house_calendar_events 
  FOR UPDATE TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- 5. FINAL CHECKLIST ITEM FIX
-- Ensure Staff can select items for their assigned checklists.
ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff select assigned house checklist items" ON public.house_checklist_items;

CREATE POLICY "Staff select assigned house checklist items" ON public.house_checklist_items 
  FOR SELECT TO authenticated 
  USING (checklist_id IN (
    SELECT id FROM public.house_checklists 
    WHERE house_id IN (
      SELECT house_id FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  ));

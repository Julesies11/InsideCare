-- ========================================================================================
-- RLS POLICY FIX: House Checklist System & Calendar 2026-03-20
-- Objective: 
-- 1. Restore Staff access to house checklist items and master types.
-- 2. Restore Staff access to house calendar events.
-- 3. Ensure Staff can see their coworkers' assignments for coordination.
-- 4. Enable RLS and add policies for remaining House system tables.
-- ========================================================================================

-- 1. HOUSE CHECKLIST SYSTEM & CALENDAR
-- Staff need to see the items for checklists and the master event types.

ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_events ENABLE ROW LEVEL SECURITY;

-- Restore SELECT access to items
DROP POLICY IF EXISTS "Staff select assigned house checklist items" ON public.house_checklist_items;
CREATE POLICY "Staff select assigned house checklist items" ON public.house_checklist_items FOR SELECT TO authenticated 
  USING (checklist_id IN (
    SELECT id FROM public.house_checklists 
    WHERE house_id IN (
      SELECT house_id FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  ));

-- Allow SELECT access to calendar event types (needed for labels/dropdowns)
DROP POLICY IF EXISTS "Staff select house calendar event types master" ON public.house_calendar_event_types_master;
CREATE POLICY "Staff select house calendar event types master" ON public.house_calendar_event_types_master FOR SELECT TO authenticated USING (true);

-- Allow SELECT/INSERT/UPDATE for calendar events (scoped by house)
DROP POLICY IF EXISTS "Staff manage assigned house calendar events" ON public.house_calendar_events;
CREATE POLICY "Staff manage assigned house calendar events" ON public.house_calendar_events FOR ALL TO authenticated 
  USING (house_id IN (
    SELECT house_id FROM public.house_staff_assignments hsa 
    JOIN public.staff s ON s.id = hsa.staff_id 
    WHERE s.auth_user_id = auth.uid()
  ));

-- 2. ADDITIONAL HOUSE SYSTEMS (Missing from previous hardening)
ALTER TABLE public.house_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_form_submissions ENABLE ROW LEVEL SECURITY;

-- Standard scoped policies for these (Access based on house assignment)
CREATE POLICY "Staff select house resources" ON public.house_resources FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff select house files" ON public.house_files FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff select house forms" ON public.house_forms FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned house form assignments" ON public.house_form_assignments FOR ALL TO authenticated 
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned house form submissions" ON public.house_form_submissions FOR ALL TO authenticated 
  USING (submitted_by IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- 3. HOUSE STAFF ASSIGNMENTS (Coworker visibility)
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select coworkers in same houses" ON public.house_staff_assignments;
CREATE POLICY "Staff select coworkers in same houses" ON public.house_staff_assignments FOR SELECT TO authenticated 
  USING (house_id IN (
    SELECT house_id FROM public.house_staff_assignments hsa 
    JOIN public.staff s ON s.id = hsa.staff_id 
    WHERE s.auth_user_id = auth.uid()
  ));

-- 4. MISSING CHILD ENTITY SELECT POLICIES
ALTER TABLE public.participant_hygiene_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_restrictive_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff select participant hygiene routines" ON public.participant_hygiene_routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant restrictive practices" ON public.participant_restrictive_practices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant forms" ON public.participant_forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant medications" ON public.participant_medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant notes" ON public.participant_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant documents" ON public.participant_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant goals" ON public.participant_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant goal progress" ON public.participant_goal_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant funding" ON public.participant_funding FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant contacts" ON public.participant_contacts FOR SELECT TO authenticated USING (true);

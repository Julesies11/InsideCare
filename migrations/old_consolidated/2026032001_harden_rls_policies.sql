-- ========================================================================================
-- COMPREHENSIVE RLS HARDENING 2026-03-20
-- Objective: Drop all existing policies and recreate them with strict Admin/Staff boundaries.
-- ========================================================================================

-- 1. DROP ALL EXISTING POLICIES (Safety Clean Slate)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Public schema policies
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
    
    -- Storage schema policies
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'storage') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. ENABLE RLS ON ALL TABLES
-- Core Entities
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Participant Child Entities (Sensitive Clinical Data)
ALTER TABLE public.participant_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_hygiene_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_restrictive_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_contacts ENABLE ROW LEVEL SECURITY;

-- Operational Entities
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Checklist System
ALTER TABLE public.checklist_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_item_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_events ENABLE ROW LEVEL SECURITY;

-- System & Master Tables
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_sources_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_types_master ENABLE ROW LEVEL SECURITY;

-- 3. GLOBAL ADMIN POLICY
-- Allows Admins full access to all tables in the public schema
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING ((auth.jwt() -> ''user_metadata'' ->> ''is_admin'')::boolean = true)', t.tablename);
    END LOOP;
END $$;

-- 4. STAFF ROLE POLICIES (Scoping access for non-admin users)

-- Staff Table: Can read own profile
CREATE POLICY "Staff can read own record" ON public.staff FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- Participant Access: SELECT only (for clinical awareness)
-- Note: Sensitive fields might be handled by frontend logic or future scoped RLS
CREATE POLICY "Staff can select all participants" ON public.participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant child entities" ON public.participant_medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant notes" ON public.participant_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant goals" ON public.participant_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant goal progress" ON public.participant_goal_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant hygiene routines" ON public.participant_hygiene_routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant contacts" ON public.participant_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant restrictive practices" ON public.participant_restrictive_practices FOR SELECT TO authenticated USING (true);

-- Houses & Assignments: SELECT only
CREATE POLICY "Staff can select all houses" ON public.houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select own house assignments" ON public.house_staff_assignments FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- Shifts & Roster: SELECT only (Full transparency for continuity of care)
CREATE POLICY "Staff can select staff shifts" ON public.staff_shifts FOR SELECT TO authenticated USING (true);

-- Shift Notes: Read all, create any, update own
CREATE POLICY "Staff can select all shift notes" ON public.shift_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert shift notes" ON public.shift_notes FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own shift notes" ON public.shift_notes FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- Timesheets: Manage own only
CREATE POLICY "Staff can select own timesheets" ON public.timesheets FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can insert own timesheets" ON public.timesheets FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own pending timesheets" ON public.timesheets FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()) AND status IN ('draft', 'pending'));

-- Leave Requests: Manage own only
CREATE POLICY "Staff can select own leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can insert own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own pending leave requests" ON public.leave_requests FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()) AND status = 'pending');

-- Compliance & Training: Read own only
CREATE POLICY "Staff can select own compliance" ON public.staff_compliance FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can select own training" ON public.staff_training FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can select own documents" ON public.staff_documents FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- Checklist System (Staff access scoped to assigned houses)
CREATE POLICY "Staff select checklist templates" ON public.checklist_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select checklist item templates" ON public.checklist_item_master FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage assigned house checklists" ON public.house_checklists FOR ALL TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned checklist submissions" ON public.house_checklist_submissions FOR ALL TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned submission items" ON public.house_checklist_submission_items FOR ALL TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff manage assigned checklist attachments" ON public.house_checklist_item_attachments FOR ALL TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff select assigned checklist schedules" ON public.checklist_schedules FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- System & Master Tables: Read-only for staff
CREATE POLICY "Staff select master tables" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select medications master" ON public.medications_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select leave types" ON public.leave_types FOR SELECT TO authenticated USING (true);

-- Activity Logs & Notifications
CREATE POLICY "Authenticated users insert activity log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users select activity log" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- Error Logs
CREATE POLICY "Users insert error logs" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Anon insert error logs" ON public.error_logs FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- 5. STORAGE POLICIES
-- Scoped access for storage buckets

CREATE POLICY "Admins full storage access" ON storage.objects FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Checklist Attachments: SELECT if assigned to house, INSERT if assigned
CREATE POLICY "Staff select house attachments" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'checklist-attachments' AND (EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa
    JOIN public.staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
  )));

CREATE POLICY "Staff upload house attachments" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'checklist-attachments' AND (EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa
    JOIN public.staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
  )));

-- Profile Photos: Publicly readable for authenticated users (to show in UI)
CREATE POLICY "Authenticated users read profile photos" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id IN ('participant-photos', 'staff-photos'));

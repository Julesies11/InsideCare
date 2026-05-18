-- ========================================================================================
-- JWT-BASED RBAC SIMPLIFICATION (FIXED DEPENDENCY ORDER)
-- Date: 2026-05-18
-- Objective: Replace complex SQL-based RLS with high-performance JWT metadata lookups.
-- ========================================================================================

BEGIN;

-- 1. DROP ALL EXISTING RBAC POLICIES FIRST
-- This must be done before dropping the helper functions they depend on.
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename, schemaname
    FROM pg_policies 
    WHERE (schemaname = 'public' OR schemaname = 'storage')
    AND (
      policyname LIKE 'RBAC %' OR 
      policyname IN (
        'Admins full access', 
        'Users insert error logs', 
        'Anon insert error logs', 
        'Staff select house attachments', 
        'Staff upload house attachments',
        'Authenticated users read profile photos',
        'Admins full storage access',
        'Allow authenticated to manage house_shift_templates',
        'Allow authenticated to view house_shift_templates',
        'Allow admins to manage shift_template_checklists',
        'Allow authenticated to view shift_template_checklists',
        'Allow admin manage default checklists',
        'Allow auth view default checklists',
        'Staff upload participant forms',
        'Staff select participant forms'
      )
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;


-- 2. DROP OLD HELPER FUNCTIONS
-- Now that policies are gone, we can safely remove the functions.
DROP FUNCTION IF EXISTS public.get_access_level(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_staff_assigned_to_house(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_staff_managed_by(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.do_staff_share_house(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_staff_linked_to_calendar_event(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_staff_id() CASCADE;


-- 3. DEFINE LIGHTWEIGHT HELPERS (Highly Optimized)
CREATE OR REPLACE FUNCTION public.jwt_is_admin() 
RETURNS boolean AS $$
  -- Checks persistent app_metadata for is_admin flag
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_get_staff_id() 
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_has_house(p_house_id uuid) 
RETURNS boolean AS $$
  -- JSONB containment check for assigned houses array
  SELECT (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_manages_staff(p_staff_id uuid) 
RETURNS boolean AS $$
  -- JSONB containment check for managed staff IDs array
  SELECT (auth.jwt() -> 'app_metadata' -> 'managed_staff_ids') @> jsonb_build_array(p_staff_id::text);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_get_perm(p_module text) 
RETURNS text AS $$
  SELECT auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 4. APPLY NEW SIMPLIFIED POLICIES

-- ==========================================
-- MASTER LISTS (Global Select, Admin Write)
-- ==========================================
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'branches', 'checklist_item_master', 'checklist_master', 'contact_types_master', 
        'departments', 'employment_types_master', 'funding_sources_master', 'funding_types_master', 
        'house_calendar_event_types_master', 'leave_types', 'medications_master', 'positions', 
        'providers', 'services', 'house_types_master'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (public.jwt_is_admin() OR (public.jwt_get_perm(''master_lists'') = ''full''))', t, t);
    END LOOP;
END $$;


-- ==========================================
-- ACCESS CONTROL (Roles & Permissions)
-- ==========================================
CREATE POLICY "RBAC roles SELECT" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC roles ALL" ON public.roles FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('access_control') = 'full');

CREATE POLICY "RBAC role_permissions SELECT" ON public.role_permissions FOR SELECT TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('access_control') IN ('full', 'read_only'));

CREATE POLICY "RBAC role_permissions ALL" ON public.role_permissions FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('access_control') = 'full');


-- ==========================================
-- HOUSES & FACILITIES
-- ==========================================
CREATE POLICY "RBAC houses SELECT" ON public.houses FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('houses') IN ('full', 'read_only') OR 
    (public.jwt_get_perm('houses') IN ('context_read_write', 'context_read_only') AND public.jwt_has_house(id))
);

CREATE POLICY "RBAC houses ALL" ON public.houses FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('houses') = 'full');

-- House Child Entities (House Comms, Files, Resources)
CREATE POLICY "RBAC house_comms SELECT" ON public.house_comms FOR SELECT TO authenticated
USING (public.jwt_is_admin() OR public.jwt_has_house(house_id));

CREATE POLICY "RBAC house_comms ALL" ON public.house_comms FOR ALL TO authenticated
USING (public.jwt_is_admin() OR (public.jwt_get_perm('houses') = 'context_read_write' AND public.jwt_has_house(house_id)));

CREATE POLICY "RBAC house_files SELECT" ON public.house_files FOR SELECT TO authenticated
USING (public.jwt_is_admin() OR public.jwt_has_house(house_id));

CREATE POLICY "RBAC house_files ALL" ON public.house_files FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('houses') = 'full');

CREATE POLICY "RBAC house_resources SELECT" ON public.house_resources FOR SELECT TO authenticated
USING (public.jwt_is_admin() OR public.jwt_has_house(house_id));

CREATE POLICY "RBAC house_shift_templates SELECT" ON public.house_shift_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC house_shift_templates ALL" ON public.house_shift_templates FOR ALL TO authenticated 
USING (public.jwt_is_admin() OR public.jwt_get_perm('houses') = 'full');


-- ==========================================
-- PARTICIPANTS
-- ==========================================
CREATE POLICY "RBAC participants SELECT" ON public.participants FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('participants') IN ('full', 'read_only') OR 
    public.jwt_has_house(house_id)
);

CREATE POLICY "RBAC participants ALL" ON public.participants FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('participants') = 'full');

-- Participant Child Entities (Medications, Notes, Goals, etc.)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'participant_contacts', 'participant_documents', 'participant_funding', 
        'participant_goals', 'participant_hygiene_routines', 'participant_forms',
        'participant_notes', 'participant_restrictive_practices', 'participant_medications'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated 
            USING (public.jwt_is_admin() OR public.jwt_get_perm(''participants'') IN (''full'', ''read_only'') OR 
            EXISTS (SELECT 1 FROM public.participants p WHERE p.id = %I.participant_id AND public.jwt_has_house(p.house_id)))', t, t, t);
            
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (public.jwt_is_admin() OR public.jwt_get_perm(''participants'') = ''full'' OR 
            (public.jwt_get_perm(''participants'') = ''context_read_write'' AND EXISTS (SELECT 1 FROM public.participants p WHERE p.id = %I.participant_id AND public.jwt_has_house(p.house_id))))', t, t, t);
    END LOOP;
END $$;

-- Special Case: participant_goal_progress (joined via participant_goals)
CREATE POLICY "RBAC participant_goal_progress SELECT" ON public.participant_goal_progress FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('participants') IN ('full', 'read_only') OR 
    EXISTS (
        SELECT 1 FROM public.participant_goals pg 
        JOIN public.participants p ON p.id = pg.participant_id 
        WHERE pg.id = public.participant_goal_progress.goal_id AND public.jwt_has_house(p.house_id)
    )
);

CREATE POLICY "RBAC participant_goal_progress ALL" ON public.participant_goal_progress FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('participants') = 'full' OR 
    (public.jwt_get_perm('participants') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM public.participant_goals pg 
        JOIN public.participants p ON p.id = pg.participant_id 
        WHERE pg.id = public.participant_goal_progress.goal_id AND public.jwt_has_house(p.house_id)
    ))
);


-- ==========================================
-- STAFF & EMPLOYEES
-- ==========================================
CREATE POLICY "RBAC staff SELECT" ON public.staff FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    auth_user_id = auth.uid() OR 
    public.jwt_get_perm('employees') IN ('full', 'read_only') OR 
    public.jwt_manages_staff(id)
);

CREATE POLICY "RBAC staff ALL" ON public.staff FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('employees') = 'full');

-- Staff Assignments
CREATE POLICY "RBAC house_staff_assignments SELECT" ON public.house_staff_assignments FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    staff_id = public.jwt_get_staff_id() OR 
    public.jwt_get_perm('employees') IN ('full', 'read_only') OR 
    public.jwt_has_house(house_id) OR 
    public.jwt_manages_staff(staff_id)
);

-- Staff Compliance/Training/Docs
DO $$
DECLARE
    t text;
    tables text[] := ARRAY['staff_compliance', 'staff_training', 'staff_documents'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated 
            USING (public.jwt_is_admin() OR staff_id = public.jwt_get_staff_id() OR public.jwt_get_perm(''employees'') IN (''full'', ''read_only'') OR public.jwt_manages_staff(staff_id))', t, t);
            
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (public.jwt_is_admin() OR public.jwt_get_perm(''employees'') = ''full'' OR (public.jwt_get_perm(''employees'') = ''context_read_write'' AND public.jwt_manages_staff(staff_id)))', t, t);
    END LOOP;
END $$;


-- ==========================================
-- ROSTER & SHIFTS
-- ==========================================
CREATE POLICY "RBAC staff_shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    staff_id = public.jwt_get_staff_id() OR 
    public.jwt_get_perm('roster_board') IN ('full', 'read_only') OR 
    public.jwt_has_house(house_id) OR 
    public.jwt_manages_staff(staff_id)
);

CREATE POLICY "RBAC staff_shifts ALL" ON public.staff_shifts FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('roster_board') = 'full' OR 
    (public.jwt_get_perm('roster_board') = 'context_read_write' AND public.jwt_has_house(house_id))
);

-- Shift Notes
CREATE POLICY "RBAC shift_notes SELECT" ON public.shift_notes FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    staff_id = public.jwt_get_staff_id() OR 
    public.jwt_get_perm('shift_notes') IN ('full', 'read_only') OR 
    public.jwt_has_house(house_id) OR 
    public.jwt_manages_staff(staff_id)
);

CREATE POLICY "RBAC shift_notes ALL" ON public.shift_notes FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    staff_id = public.jwt_get_staff_id() OR 
    (public.jwt_get_perm('shift_notes') = 'context_read_write' AND public.jwt_manages_staff(staff_id))
);


-- ==========================================
-- TIMESHEETS & LEAVE
-- ==========================================
CREATE POLICY "RBAC timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    staff_id = public.jwt_get_staff_id() OR 
    public.jwt_get_perm('timesheets') IN ('full', 'read_only') OR 
    public.jwt_manages_staff(staff_id)
);

CREATE POLICY "RBAC timesheets ALL" ON public.timesheets FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    (staff_id = public.jwt_get_staff_id() AND status IN ('draft', 'pending')) OR 
    public.jwt_get_perm('timesheets') = 'full' OR 
    (public.jwt_get_perm('timesheets') = 'context_read_write' AND public.jwt_manages_staff(staff_id))
);

CREATE POLICY "RBAC leave_requests SELECT" ON public.leave_requests FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    staff_id = public.jwt_get_staff_id() OR 
    public.jwt_get_perm('leave_requests') IN ('full', 'read_only') OR 
    public.jwt_manages_staff(staff_id)
);

CREATE POLICY "RBAC leave_requests ALL" ON public.leave_requests FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    (staff_id = public.jwt_get_staff_id() AND status = 'pending') OR 
    public.jwt_get_perm('leave_requests') = 'full' OR 
    (public.jwt_get_perm('leave_requests') = 'context_read_write' AND public.jwt_manages_staff(staff_id))
);


-- ==========================================
-- CHECKLISTS & SUBMISSIONS
-- ==========================================
-- House Checklists (Base)
CREATE POLICY "RBAC house_checklists SELECT" ON public.house_checklists FOR SELECT TO authenticated 
USING (public.jwt_is_admin() OR public.jwt_get_perm('house_checklists') IN ('full', 'read_only') OR public.jwt_has_house(house_id));

CREATE POLICY "RBAC house_checklists ALL" ON public.house_checklists FOR ALL TO authenticated 
USING (public.jwt_is_admin() OR public.jwt_get_perm('house_checklists') = 'full' OR (public.jwt_get_perm('house_checklists') = 'context_read_write' AND public.jwt_has_house(house_id)));

-- House Checklist Items (Joined via house_checklists)
CREATE POLICY "RBAC house_checklist_items SELECT" ON public.house_checklist_items FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('house_checklists') IN ('full', 'read_only') OR 
    EXISTS (SELECT 1 FROM public.house_checklists hc WHERE hc.id = checklist_id AND public.jwt_has_house(hc.house_id))
);

CREATE POLICY "RBAC house_checklist_items ALL" ON public.house_checklist_items FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('house_checklists') = 'full' OR 
    (public.jwt_get_perm('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM public.house_checklists hc WHERE hc.id = checklist_id AND public.jwt_has_house(hc.house_id)))
);

-- Checklist Submissions (Linked to house via house_id)
CREATE POLICY "RBAC house_checklist_submissions SELECT" ON public.house_checklist_submissions FOR SELECT TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('house_checklists') IN ('full', 'read_only') OR public.jwt_has_house(house_id));

CREATE POLICY "RBAC house_checklist_submissions ALL" ON public.house_checklist_submissions FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('house_checklists') = 'context_read_write' OR public.jwt_has_house(house_id));

-- Submission Items (Joined to submission)
CREATE POLICY "RBAC house_checklist_submission_items SELECT" ON public.house_checklist_submission_items FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.jwt_has_house(hcs.house_id) OR public.jwt_get_perm('house_checklists') IN ('full', 'read_only')))
);

CREATE POLICY "RBAC house_checklist_submission_items ALL" ON public.house_checklist_submission_items FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.jwt_has_house(hcs.house_id) OR public.jwt_get_perm('house_checklists') = 'context_read_write'))
);

-- Shift Assigned Checklists
CREATE POLICY "RBAC shift_assigned_checklists SELECT" ON public.shift_assigned_checklists FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.staff_shifts ss WHERE ss.id = shift_id AND (ss.staff_id = public.jwt_get_staff_id() OR public.jwt_has_house(ss.house_id)))
);

CREATE POLICY "RBAC shift_assigned_checklists ALL" ON public.shift_assigned_checklists FOR ALL TO authenticated
USING (public.jwt_is_admin() OR public.jwt_get_perm('roster_board') = 'full');

-- Checklist Item Attachments
CREATE POLICY "RBAC house_checklist_item_attachments SELECT" ON public.house_checklist_item_attachments FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.jwt_has_house(hcs.house_id) OR public.jwt_get_perm('house_checklists') IN ('full', 'read_only')))
);

CREATE POLICY "RBAC house_checklist_item_attachments ALL" ON public.house_checklist_item_attachments FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.jwt_has_house(hcs.house_id) OR public.jwt_get_perm('house_checklists') = 'context_read_write'))
);


-- ==========================================
-- CALENDAR & EVENTS
-- ==========================================
CREATE POLICY "RBAC house_calendar_events SELECT" ON public.house_calendar_events FOR SELECT TO authenticated
USING (public.jwt_is_admin() OR public.jwt_has_house(house_id) OR public.jwt_get_perm('houses') IN ('full', 'read_only'));

CREATE POLICY "RBAC house_calendar_events ALL" ON public.house_calendar_events FOR ALL TO authenticated
USING (public.jwt_is_admin() OR (public.jwt_get_perm('houses') = 'context_read_write' AND public.jwt_has_house(house_id)));

-- Event Staff/Participants (Joined via house_calendar_events)
CREATE POLICY "RBAC house_calendar_event_staff SELECT" ON public.house_calendar_event_staff FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_calendar_events hce WHERE hce.id = event_id AND (public.jwt_has_house(hce.house_id) OR public.jwt_get_perm('houses') IN ('full', 'read_only')))
);

CREATE POLICY "RBAC house_calendar_event_staff ALL" ON public.house_calendar_event_staff FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_calendar_events hce WHERE hce.id = event_id AND (public.jwt_has_house(hce.house_id) AND public.jwt_get_perm('houses') = 'context_read_write'))
);

CREATE POLICY "RBAC house_calendar_event_participants SELECT" ON public.house_calendar_event_participants FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_calendar_events hce WHERE hce.id = event_id AND (public.jwt_has_house(hce.house_id) OR public.jwt_get_perm('houses') IN ('full', 'read_only')))
);

CREATE POLICY "RBAC house_calendar_event_participants ALL" ON public.house_calendar_event_participants FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_calendar_events hce WHERE hce.id = event_id AND (public.jwt_has_house(hce.house_id) AND public.jwt_get_perm('houses') = 'context_read_write'))
);

-- Shift Participants (Joined via staff_shifts)
CREATE POLICY "RBAC shift_participants SELECT" ON public.shift_participants FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.staff_shifts ss WHERE ss.id = shift_id AND (public.jwt_has_house(ss.house_id) OR public.jwt_get_perm('roster_board') IN ('full', 'read_only')))
);

CREATE POLICY "RBAC shift_participants ALL" ON public.shift_participants FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('roster_board') = 'full' OR
    EXISTS (SELECT 1 FROM public.staff_shifts ss WHERE ss.id = shift_id AND (public.jwt_has_house(ss.house_id) AND public.jwt_get_perm('roster_board') = 'context_read_write'))
);


-- ==========================================
-- SYSTEM & UTILITY
-- ==========================================
CREATE POLICY "RBAC activity_log ALL (Admin)" ON public.activity_log FOR ALL TO authenticated USING (public.jwt_is_admin());
CREATE POLICY "RBAC activity_log SELECT" ON public.activity_log FOR SELECT TO authenticated USING (public.jwt_is_admin() OR public.jwt_get_perm('activity_log') = 'full');

CREATE POLICY "RBAC notifications ALL" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR public.jwt_is_admin());

-- Error Logs
CREATE POLICY "RBAC error_logs ALL" ON public.error_logs FOR ALL TO authenticated USING (public.jwt_is_admin());
CREATE POLICY "RBAC error_logs INSERT" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);


-- ==========================================
-- STORAGE (storage.objects)
-- ==========================================
CREATE POLICY "RBAC storage_objects SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    bucket_id = 'public' OR
    (bucket_id = 'staff-photos') OR
    (bucket_id = 'participant-photos') OR
    (bucket_id = 'checklist-attachments' AND EXISTS (
        SELECT 1 FROM public.house_staff_assignments hsa 
        WHERE hsa.staff_id = public.jwt_get_staff_id() 
        AND (hsa.end_date IS NULL OR hsa.end_date > now())
    ))
);

CREATE POLICY "RBAC storage_objects ALL" ON storage.objects FOR ALL TO authenticated
USING (public.jwt_is_admin());

COMMIT;

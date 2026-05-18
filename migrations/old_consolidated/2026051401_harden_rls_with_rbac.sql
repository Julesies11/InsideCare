-- ========================================================================================
-- RBAC RLS HARDENING 2026-05-14
-- Objective: Enforce context_locked permissions at the database level using JWT metadata.
-- ========================================================================================

-- 0. SCHEMA ADJUSTMENTS
-- (No schema adjustments required as timesheets/leave are managed via reporting lines)

-- 1. HELPERS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
         (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Management', 'Director', 'Admin');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name)::public.access_level_enum,
    'none'::public.access_level_enum
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
  SELECT id FROM public.staff WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 2. CLEANUP OLD POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'houses', 'participants', 'staff', 'staff_shifts', 'shift_notes', 
            'timesheets', 'leave_requests', 'house_staff_assignments',
            'participant_medications', 'participant_notes', 'participant_goals',
            'participant_goal_progress', 'participant_hygiene_routines',
            'participant_contacts', 'participant_restrictive_practices',
            'house_checklists', 'house_checklist_items', 'house_checklist_submissions',
            'house_checklist_submission_items', 'house_checklist_item_attachments',
            'house_calendar_events', 'checklist_schedules'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. HOUSES POLICIES
CREATE POLICY "RBAC Houses SELECT" ON public.houses
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_profiles') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id() 
            AND hsa.house_id = public.houses.id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full'
);

-- 4. PARTICIPANTS POLICIES
CREATE POLICY "RBAC Participants SELECT" ON public.participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id() 
            AND hsa.house_id = public.participants.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC Participants ALL (Admin/Full)" ON public.participants
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
);

-- 5. STAFF POLICIES
CREATE POLICY "RBAC Staff SELECT" ON public.staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        EXISTS (
            -- Staff can see other staff assigned to the same houses OR their direct reports
            SELECT 1 FROM public.house_staff_assignments hsa1
            JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
            WHERE hsa1.staff_id = public.get_my_staff_id()
            AND hsa2.staff_id = public.staff.id
            AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
            AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
        ) OR
        public.staff.manager_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Staff ALL (Admin/Full)" ON public.staff
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
);

-- 6. SHIFTS POLICIES (Roster Board)
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('roster_board') = 'context_locked' AND
        (
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa
                WHERE hsa.staff_id = public.get_my_staff_id()
                AND hsa.house_id = public.staff_shifts.house_id
                AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
            ) OR
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.staff_shifts.staff_id
                AND s.manager_id = public.get_my_staff_id()
            )
        )
    )
);

CREATE POLICY "RBAC Shifts ALL (Admin/Full)" ON public.staff_shifts
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full'
);

-- 7. TIMESHEETS POLICIES
-- Managerial line enforcement
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE s.id = public.timesheets.staff_id
            AND s.manager_id = public.get_my_staff_id()
        )
    )
);

CREATE POLICY "RBAC Timesheets INSERT (Submit)" ON public.timesheets
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('timesheets_submit') IN ('full', 'context_locked') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'draft') OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE s.id = public.timesheets.staff_id
            AND s.manager_id = public.get_my_staff_id()
        )
    )
);

-- 8. LEAVE REQUESTS POLICIES
-- Managerial line enforcement
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('leave_requests') = 'context_locked' AND
        EXISTS (
            -- Managers can see leave for their direct reports
            SELECT 1 FROM public.staff s
            WHERE s.id = public.leave_requests.staff_id
            AND s.manager_id = public.get_my_staff_id()
        )
    )
);

CREATE POLICY "RBAC Leave ALL (Own/Admin/Full)" ON public.leave_requests
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') = 'full' OR
    staff_id = public.get_my_staff_id()
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('leave_requests') = 'full' OR
    staff_id = public.get_my_staff_id()
);

-- 9. PARTICIPANT CHILD ENTITIES (Clinical Awareness)
-- These inherit from participant_profiles level
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES 
        ('participant_medications'), ('participant_notes'), ('participant_goals'),
        ('participant_goal_progress'), ('participant_hygiene_routines'),
        ('participant_contacts'), ('participant_restrictive_practices')
    LOOP
        -- Special handling for goal_progress which links via goal_id
        IF t = 'participant_goal_progress' THEN
            v_join_clause := 'JOIN public.participant_goals pg ON pg.id = public.participant_goal_progress.goal_id JOIN public.participants p ON p.id = pg.participant_id';
        ELSE
            v_join_clause := 'JOIN public.participants p ON p.id = public.' || t || '.participant_id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') IN (''full'', ''read_only'') OR
                (
                    public.get_access_level(''participant_profiles'') = ''context_locked'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = p.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);
        
        EXECUTE format('
            CREATE POLICY "RBAC %I ALL (Admin/Full)" ON public.%I FOR ALL TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full''
            )
            WITH CHECK (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full''
            );
        ', t, t);
    END LOOP;
END $$;

-- 10. OPERATIONAL TABLES (Checklists & Routines)
-- House Checklists
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_checklists') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_checklists.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

-- House Checklist Submissions (Context locked to house assignments)
CREATE POLICY "RBAC Checklist Submissions SELECT" ON public.house_checklist_submissions
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    public.get_access_level('shift_routines') IN ('full', 'read_only') OR
    (
        (public.get_access_level('house_checklists') = 'context_locked' OR public.get_access_level('shift_routines') = 'context_locked') AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_checklist_submissions.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

-- House Staff Assignments
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        (
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa
                WHERE hsa.staff_id = public.get_my_staff_id()
                AND hsa.house_id = public.house_staff_assignments.house_id
                AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
            ) OR
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.house_staff_assignments.staff_id
                AND s.manager_id = public.get_my_staff_id()
            )
        )
    )
);

-- Shift Notes
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_locked' AND
        (
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa
                WHERE hsa.staff_id = public.get_my_staff_id()
                AND hsa.house_id = public.shift_notes.house_id
                AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
            ) OR
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.shift_notes.staff_id
                AND s.manager_id = public.get_my_staff_id()
            )
        )
    )
);

-- Child operational tables (items, submission items, etc.) - Simplified to broad read if submission is visible
CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Submission Items SELECT" ON public.house_checklist_submission_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments FOR INSERT TO authenticated WITH CHECK (true);

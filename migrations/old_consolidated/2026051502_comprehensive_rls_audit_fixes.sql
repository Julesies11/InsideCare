-- ========================================================================================
-- COMPREHENSIVE RLS AUDIT & FIXES 2026-05-17
-- Objective: Close security gaps in junction tables and unblock 'context_read_write' workflows.
-- ========================================================================================

BEGIN;

-- 1. DROP OVER-PERMISSIVE OR INCORRECT POLICIES
-- Identified in the May 15 audit.
DO $$
BEGIN
    -- Junction Tables (Over-permissive CRUD)
    DROP POLICY IF EXISTS "Allow all users to view shift_participants" ON public.shift_participants;
    DROP POLICY IF EXISTS "Allow all users to insert shift_participants" ON public.shift_participants;
    DROP POLICY IF EXISTS "Allow all users to update shift_participants" ON public.shift_participants;
    DROP POLICY IF EXISTS "Allow all users to delete shift_participants" ON public.shift_participants;

    DROP POLICY IF EXISTS "Allow authenticated select on event_participants" ON public.house_calendar_event_participants;
    DROP POLICY IF EXISTS "Allow authenticated insert on event_participants" ON public.house_calendar_event_participants;
    DROP POLICY IF EXISTS "Allow authenticated update on event_participants" ON public.house_calendar_event_participants;
    DROP POLICY IF EXISTS "Allow authenticated delete on event_participants" ON public.house_calendar_event_participants;

    DROP POLICY IF EXISTS "Allow authenticated select on event_staff" ON public.house_calendar_event_staff;
    DROP POLICY IF EXISTS "Allow authenticated insert on event_staff" ON public.house_calendar_event_staff;
    DROP POLICY IF EXISTS "Allow authenticated update on event_staff" ON public.house_calendar_event_staff;
    DROP POLICY IF EXISTS "Allow authenticated delete on event_staff" ON public.house_calendar_event_staff;

    -- Checklist Junction (Public grant)
    DROP POLICY IF EXISTS "Users can view shift assignments for their houses" ON public.shift_assigned_checklists;
    
    -- Activity Log (Privacy Leak)
    DROP POLICY IF EXISTS "Authenticated users select activity log" ON public.activity_log;

    -- Master Tables (Admins-only CRUD usually, but SELECT missing for some)
    -- We will re-add SELECT for all authenticated below.
END $$;

-- 2. PHASE 1: SECURE OVER-PERMISSIVE POLICIES (Security Risks)

-- 2.1 shift_participants (Locked to Roster context)
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    EXISTS (
        SELECT 1 FROM public.staff_shifts ss
        WHERE ss.id = public.shift_participants.shift_id
        AND (ss.staff_id = public.get_my_staff_id() OR public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id))
    )
);

CREATE POLICY "RBAC Shift Participants ALL (Admin/Full/Context)" ON public.shift_participants
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full' OR
    (
        public.get_access_level('roster_board') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.staff_shifts ss
            WHERE ss.id = public.shift_participants.shift_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id)
        )
    )
);

-- 2.2 house_calendar_event_participants (Locked to House Profiles context)
CREATE POLICY "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    EXISTS (
        SELECT 1 FROM public.house_calendar_events hce
        WHERE hce.id = public.house_calendar_event_participants.event_id
        AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
    ) OR
    EXISTS (
        -- Also visible if the staff is explicitly assigned to this specific event
        SELECT 1 FROM public.house_calendar_event_staff hces
        WHERE hces.event_id = public.house_calendar_event_participants.event_id
        AND hces.staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Calendar Event Participants ALL (Admin/Full/Context)" ON public.house_calendar_event_participants
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full' OR
    (
        public.get_access_level('house_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.house_calendar_events hce
            WHERE hce.id = public.house_calendar_event_participants.event_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
        )
    )
);

-- 2.3 house_calendar_event_staff (Locked to House Profiles context)
CREATE POLICY "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    EXISTS (
        SELECT 1 FROM public.house_calendar_events hce
        WHERE hce.id = public.house_calendar_event_staff.event_id
        AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
    )
);

CREATE POLICY "RBAC Calendar Event Staff ALL (Admin/Full/Context)" ON public.house_calendar_event_staff
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full' OR
    (
        public.get_access_level('house_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.house_calendar_events hce
            WHERE hce.id = public.house_calendar_event_staff.event_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
        )
    )
);

-- 2.4 shift_assigned_checklists (Restricted to Authenticated + Context)
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_routines') IN ('full', 'read_only') OR
    EXISTS (
        SELECT 1 FROM public.staff_shifts ss
        WHERE ss.id = public.shift_assigned_checklists.shift_id
        AND (ss.staff_id = public.get_my_staff_id() OR public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id))
    )
);

-- 2.5 activity_log (Limit to Admins/Full)
CREATE POLICY "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('activity_log') = 'full'
);

-- 3. PHASE 2: UNBLOCK 'context_read_write' MANAGERS (Workflow Blockers)

-- 3.1 staff_shifts (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Shifts ALL (Admin/Full)" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts ALL (Admin/Full/Context)" ON public.staff_shifts
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full' OR
    (
        public.get_access_level('roster_board') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full' OR
    (
        public.get_access_level('roster_board') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- 3.2 participant_medications (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Medications ALL" ON public.participant_medications;
CREATE POLICY "RBAC Medications ALL (Admin/Full/Context)" ON public.participant_medications
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_medications.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_medications.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

-- 3.3 staff_compliance (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Staff Compliance ALL" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance ALL (Admin/Full/Context)" ON public.staff_compliance
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- 3.4 participant_funding (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Participant Funding ALL" ON public.participant_funding;
CREATE POLICY "RBAC Participant Funding ALL (Admin/Full/Context)" ON public.participant_funding
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_funding.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_funding.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

-- 3.5 house_checklists (Add ALL for context_read_write)
CREATE POLICY "RBAC House Checklists ALL (Admin/Full/Context)" ON public.house_checklists
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') = 'full' OR
    (
        public.get_access_level('house_checklists') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_checklists') = 'full' OR
    (
        public.get_access_level('house_checklists') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- 3.6 house_staff_assignments (Add ALL for context_read_write)
CREATE POLICY "RBAC House Staff Assignments ALL (Admin/Full/Context)" ON public.house_staff_assignments
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);


-- 4. PHASE 3: ADD MISSING CORE OPERATIONS (Functional Gaps)

-- 4.1 house_checklist_submissions (INSERT)
CREATE POLICY "RBAC Checklist Submissions INSERT" ON public.house_checklist_submissions
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'context_read_write') OR
    public.get_access_level('shift_routines') IN ('full', 'context_read_write') AND
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
);

-- 4.2 house_checklist_submission_items (INSERT)
CREATE POLICY "RBAC Checklist Submission Items INSERT" ON public.house_checklist_submission_items
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('shift_routines') IN ('full', 'context_read_write') AND
            public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
        )
    )
);

-- 4.3 participants (INSERT/DELETE)
CREATE POLICY "RBAC Participants INSERT" ON public.participants
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

CREATE POLICY "RBAC Participants DELETE" ON public.participants
FOR DELETE TO authenticated
USING (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

-- 4.4 staff (INSERT/DELETE)
CREATE POLICY "RBAC Staff INSERT" ON public.staff
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR public.get_access_level('staff_profiles') = 'full');

CREATE POLICY "RBAC Staff DELETE" ON public.staff
FOR DELETE TO authenticated
USING (public.is_admin() OR public.get_access_level('staff_profiles') = 'full');

-- 4.5 House Forms (ALL)
-- Allowing managers to manage their own house forms.
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES ('house_forms'), ('house_form_assignments'), ('house_form_submissions') LOOP
        IF t = 'house_forms' THEN
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.house_forms.id';
        ELSE
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.form_id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I ALL (Admin/Full/Context)" ON public.%I FOR ALL TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') = ''full'' OR
                (
                    public.get_access_level(''house_checklists'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            )
            WITH CHECK (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') = ''full'' OR
                (
                    public.get_access_level(''house_checklists'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause, v_join_clause);
    END LOOP;
END $$;

-- 4.6 Master/Lookup Tables (SELECT for all staff, ALL for Master Lists permission)
-- Ensuring all essential master tables are readable for dropdowns.
DO $$
DECLARE
    t text;
    v_master_tables text[] := ARRAY[
        'contact_types_master', 'funding_sources_master', 'employment_types_master',
        'house_types_master', 'funding_types_master', 'branches', 'departments',
        'roles', 'medications_master', 'leave_types', 'house_calendar_event_types_master',
        'checklist_master', 'checklist_item_master'
    ];
BEGIN
    FOREACH t IN ARRAY v_master_tables LOOP
        -- SELECT POLICY
        EXECUTE format('DROP POLICY IF EXISTS "Staff select %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Staff select %I" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        
        -- ALL POLICY (Locked to master_lists permission)
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL (Admin/Full)" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL (Admin/Full)" ON public.%I FOR ALL TO authenticated 
            USING (public.is_admin() OR public.get_access_level(''master_lists'') = ''full'')
            WITH CHECK (public.is_admin() OR public.get_access_level(''master_lists'') = ''full'')', t, t, t, t);
    END LOOP;
END $$;

COMMIT;

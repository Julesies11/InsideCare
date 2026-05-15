-- ========================================================================================
-- ULTIMATE RBAC ENHANCEMENT: UNIFIED SCHEMA & POLICIES 2026-05-16
-- Objective: Robustly rename 'context_locked' to 'context_read_write' and add 'context_read_only'.
-- This script integrates ALL hardening logic, recursion fixes, and approval constraints.
-- ========================================================================================

BEGIN;

-- 1. DROP ALL RBAC POLICIES FIRST
-- We must drop policies that depend on the helper functions before we can modify/replace them.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (policyname LIKE 'RBAC %' OR policyname = 'Admins manage role permissions')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 2. DROP DEPENDENT FUNCTIONS
DROP FUNCTION IF EXISTS public.get_access_level(text);
DROP FUNCTION IF EXISTS public.is_staff_assigned_to_house(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_staff_managed_by(uuid, uuid);
DROP FUNCTION IF EXISTS public.do_staff_share_house(uuid, uuid);

-- 3. CREATE NEW ENUM TYPE (Temporary)
-- This bypasses PostgreSQL's transaction limitations on modifying enum types.
CREATE TYPE public.access_level_enum_new AS ENUM ('full', 'context_read_write', 'context_read_only', 'read_only', 'none');

-- 4. CONVERT ROLE_PERMISSIONS COLUMNS
-- Map old 'context_locked' values to the new 'context_read_write'.
DO $$
DECLARE
    col_name TEXT;
    columns_to_convert TEXT[] := ARRAY[
        'participant_profiles', 'staff_profiles', 'house_profiles', 'shift_notes',
        'participant_documents', 'house_documents', 'staff_documents', 'roster_board',
        'assign_staff_to_shift', 'timesheets_submit', 'timesheets_approve',
        'house_checklists', 'shift_routines', 'leave_requests'
    ];
BEGIN
    FOREACH col_name IN ARRAY columns_to_convert LOOP
        EXECUTE format('ALTER TABLE public.role_permissions ALTER COLUMN %I DROP DEFAULT', col_name);
        EXECUTE format('
            ALTER TABLE public.role_permissions 
            ALTER COLUMN %I TYPE public.access_level_enum_new 
            USING (
                CASE 
                    WHEN %I::text = ''context_locked'' THEN ''context_read_write'' 
                    ELSE %I::text 
                END
            )::public.access_level_enum_new', col_name, col_name, col_name);
        EXECUTE format('ALTER TABLE public.role_permissions ALTER COLUMN %I SET DEFAULT ''none''::public.access_level_enum_new', col_name);
    END LOOP;
END $$;

-- 5. SWAP ENUM TYPES
DROP TYPE public.access_level_enum;
ALTER TYPE public.access_level_enum_new RENAME TO access_level_enum;

-- 6. RECREATE HELPERS
-- A. get_access_level: Core helper for extracting RBAC levels from JWT metadata.
CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_perm_text text;
BEGIN
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name;
  -- Transition shim
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql STABLE;

-- B. is_staff_assigned_to_house: SECURITY DEFINER helper to break RLS recursion.
CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_house(p_staff_id UUID, p_house_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments
    WHERE staff_id = p_staff_id AND house_id = p_house_id
    AND (end_date IS NULL OR end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- C. is_staff_managed_by: SECURITY DEFINER helper for managerial line checks.
CREATE OR REPLACE FUNCTION public.is_staff_managed_by(p_staff_id UUID, p_manager_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = p_staff_id AND manager_id = p_manager_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- D. do_staff_share_house: SECURITY DEFINER helper for peer-to-peer visibility.
CREATE OR REPLACE FUNCTION public.do_staff_share_house(p_staff_id_1 UUID, p_staff_id_2 UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa1
    JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
    WHERE hsa1.staff_id = p_staff_id_1 AND hsa2.staff_id = p_staff_id_2
    AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
    AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. RECREATE POLICIES (EXHAUSTIVE & HARDENED)

-- 7.0 ROLE PERMISSIONS
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
    FOR ALL TO authenticated
    USING (public.is_admin());

-- 7.1 HOUSES
CREATE POLICY "RBAC Houses SELECT" ON public.houses
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_profiles') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), id)
    )
);

CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('house_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('house_profiles') = 'full');

-- 7.2 PARTICIPANTS
CREATE POLICY "RBAC Participants SELECT" ON public.participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

CREATE POLICY "RBAC Participants UPDATE" ON public.participants
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- 7.3 STAFF
CREATE POLICY "RBAC Staff SELECT" ON public.staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('staff_profiles') IN ('context_read_write', 'context_read_only') AND
        (
            public.do_staff_share_house(public.get_my_staff_id(), id) OR
            public.is_staff_managed_by(id, public.get_my_staff_id())
        )
    )
);

CREATE POLICY "RBAC Staff UPDATE" ON public.staff
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    auth_user_id = auth.uid()
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    auth_user_id = auth.uid()
);

-- 7.4 STAFF SHIFTS (Roster Board)
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

CREATE POLICY "RBAC Shifts ALL (Admin/Full)" ON public.staff_shifts
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('roster_board') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('roster_board') = 'full');

-- 7.5 TIMESHEETS
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('timesheets_approve') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

CREATE POLICY "RBAC Timesheets INSERT (Submit)" ON public.timesheets
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('timesheets_submit') IN ('full', 'context_read_write') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status IN ('draft', 'pending')) OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    ) OR
    (
        staff_id = public.get_my_staff_id() AND status IN ('draft', 'pending')
    )
);

-- 7.6 LEAVE REQUESTS
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('leave_requests') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

CREATE POLICY "RBAC Leave INSERT" ON public.leave_requests
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('leave_requests') IN ('full', 'context_read_write') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Leave UPDATE" ON public.leave_requests
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending') OR
    (
        public.get_access_level('leave_requests') IN ('full', 'context_read_write') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('leave_requests') IN ('full', 'context_read_write') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    ) OR
    (
        staff_id = public.get_my_staff_id() AND status = 'pending'
    )
);

CREATE POLICY "RBAC Leave DELETE" ON public.leave_requests
FOR DELETE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending')
);

-- 7.7 CLINICAL CHILD ENTITIES
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
                    public.get_access_level(''participant_profiles'') IN (''context_read_write'', ''context_read_only'') AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = p.house_id AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);
    END LOOP;
END $$;

-- 7.7.1 Medications Hardening: Only Full access can manage lifecycle
CREATE POLICY "RBAC Medications ALL" ON public.participant_medications
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('participant_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

-- 7.7.2 Other Child Entities: Full or Context Read/Write can manage
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN VALUES 
        ('participant_notes'), ('participant_goals'),
        ('participant_goal_progress'), ('participant_hygiene_routines'),
        ('participant_contacts'), ('participant_restrictive_practices')
    LOOP
        EXECUTE format('
            CREATE POLICY "RBAC %I ALL (Full/Context)" ON public.%I FOR ALL TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full'' OR
                (
                    public.get_access_level(''participant_profiles'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.participants p
                        WHERE p.id = public.%I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
                    )
                )
            )
            WITH CHECK (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full'' OR
                (
                    public.get_access_level(''participant_profiles'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.participants p
                        WHERE p.id = public.%I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
                    )
                )
            );
        ', t, t, t, t);
    END LOOP;
END $$;

-- 7.8 DOCUMENTS
CREATE POLICY "RBAC Participant Documents SELECT" ON public.participant_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_documents') IN ('context_read_write', 'context_read_only') AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_documents.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

CREATE POLICY "RBAC Participant Documents ALL" ON public.participant_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full' OR
    (
        public.get_access_level('participant_documents') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_documents.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full' OR
    (
        public.get_access_level('participant_documents') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_documents.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

-- 7.9 COMPLIANCE & TRAINING
CREATE POLICY "RBAC Staff Compliance SELECT" ON public.staff_compliance
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    public.is_staff_managed_by(staff_id, public.get_my_staff_id())
);

CREATE POLICY "RBAC Staff Compliance ALL" ON public.staff_compliance
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('staff_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('staff_profiles') = 'full');

CREATE POLICY "RBAC Staff Training SELECT" ON public.staff_training
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    public.is_staff_managed_by(staff_id, public.get_my_staff_id())
);

CREATE POLICY "RBAC Staff Training ALL" ON public.staff_training
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

-- 7.10 FUNDING (Hardened: Admin/Full only for write)
CREATE POLICY "RBAC Participant Funding SELECT" ON public.participant_funding
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') IN ('context_read_write', 'context_read_only') AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_funding.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

CREATE POLICY "RBAC Participant Funding ALL" ON public.participant_funding
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('participant_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

-- 7.11 SHIFT NOTES
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

CREATE POLICY "RBAC Shift Notes ALL" ON public.shift_notes
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') = 'full' OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('shift_notes') = 'full' OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- 7.12 CHECKLISTS & ROUTINES (Hardened as of 2026-05-15)
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklists hc
        WHERE hc.id = public.house_checklist_items.checklist_id
        AND (
            public.get_access_level('house_checklists') IN ('full', 'read_only') OR
            (
                public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hc.house_id)
            )
        )
    )
);

CREATE POLICY "RBAC Checklist Submissions SELECT" ON public.house_checklist_submissions
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    public.get_access_level('shift_routines') IN ('full', 'read_only') OR
    (
        (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR 
         public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

CREATE POLICY "RBAC Checklist Submission Items SELECT" ON public.house_checklist_submission_items
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('house_checklists') IN ('full', 'read_only') OR
            public.get_access_level('shift_routines') IN ('full', 'read_only') OR
            (
                (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR 
                 public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
            )
        )
    )
);

CREATE POLICY "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('shift_routines') = 'full' OR
            (
                public.get_access_level('shift_routines') = 'context_read_write' AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
            )
        )
    )
);

COMMIT;

-- ========================================================================================
-- RBAC RECURSION FIX 2026-05-14
-- Objective: Break infinite recursion in RLS by using SECURITY DEFINER helpers.
-- ========================================================================================

-- 1. SECURITY DEFINER HELPERS (Bypass RLS for context checks)
-- These functions run with the privileges of the DB owner, breaking the RLS dependency circle.

CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_house(p_staff_id UUID, p_house_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments
    WHERE staff_id = p_staff_id 
    AND house_id = p_house_id
    AND (end_date IS NULL OR end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff_managed_by(p_staff_id UUID, p_manager_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = p_staff_id AND manager_id = p_manager_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.do_staff_share_house(p_staff_id_1 UUID, p_staff_id_2 UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa1
    JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
    WHERE hsa1.staff_id = p_staff_id_1
    AND hsa2.staff_id = p_staff_id_2
    AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
    AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. RE-APPLY HARDENED POLICIES USING HELPERS

-- A. STAFF POLICIES
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        (
            public.do_staff_share_house(public.get_my_staff_id(), public.staff.id) OR
            public.is_staff_managed_by(public.staff.id, public.get_my_staff_id())
        )
    )
);

-- B. HOUSE STAFF ASSIGNMENTS
DROP POLICY IF EXISTS "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments;
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), public.house_staff_assignments.house_id) OR
            public.is_staff_managed_by(public.house_staff_assignments.staff_id, public.get_my_staff_id())
        )
    )
);

-- C. SHIFTS (Roster Board)
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('roster_board') = 'context_locked' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), public.staff_shifts.house_id) OR
            public.is_staff_managed_by(public.staff_shifts.staff_id, public.get_my_staff_id())
        )
    )
);

-- D. TIMESHEETS
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    )
);

DROP POLICY IF EXISTS "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'draft') OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    )
);

-- E. LEAVE REQUESTS
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('leave_requests') = 'context_locked' AND
        public.is_staff_managed_by(public.leave_requests.staff_id, public.get_my_staff_id())
    )
);

-- F. SHIFT NOTES
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_locked' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), public.shift_notes.house_id) OR
            public.is_staff_managed_by(public.shift_notes.staff_id, public.get_my_staff_id())
        )
    )
);

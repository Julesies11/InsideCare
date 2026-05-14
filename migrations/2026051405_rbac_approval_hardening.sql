-- ========================================================================================
-- RBAC APPROVAL HARDENING 2026-05-14
-- Objective: Prevent staff from approving their own timesheets or leave requests.
-- ========================================================================================

-- 1. TIMESHEETS UPDATE HARDENING
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status IN ('draft', 'pending')) OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    ) OR
    (
        -- Staff member updating their own record
        staff_id = public.get_my_staff_id() AND 
        status IN ('draft', 'pending') -- New status must still be draft or pending
    )
);

-- 2. LEAVE REQUESTS UPDATE HARDENING
DROP POLICY IF EXISTS "RBAC Leave ALL (Own/Admin/Full)" ON public.leave_requests;

-- Separate SELECT policy already exists, we just need to handle UPDATE/INSERT/DELETE

CREATE POLICY "RBAC Leave INSERT" ON public.leave_requests
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('leave_requests') IN ('full', 'context_locked') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Leave UPDATE" ON public.leave_requests
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending') OR
    public.is_staff_managed_by(public.leave_requests.staff_id, public.get_my_staff_id())
)
WITH CHECK (
    public.is_admin() OR
    public.is_staff_managed_by(public.leave_requests.staff_id, public.get_my_staff_id()) OR
    (
        -- Staff member updating their own record
        staff_id = public.get_my_staff_id() AND 
        status = 'pending' -- Cannot set to approved/rejected
    )
);

CREATE POLICY "RBAC Leave DELETE" ON public.leave_requests
FOR DELETE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending')
);

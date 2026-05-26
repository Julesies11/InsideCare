-- STAFF DATA VISIBILITY FIX
-- This migration ensures staff can see their own shifts, timesheets, and leave requests.

-- 1. Shifts
DROP POLICY IF EXISTS "RBAC ic_staff_shifts SELECT" ON public.ic_staff_shifts;
CREATE POLICY "RBAC ic_staff_shifts SELECT" ON public.ic_staff_shifts 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('my_roster') IN ('full', 'read_only')
);

-- 2. Timesheets
DROP POLICY IF EXISTS "RBAC ic_timesheets SELECT" ON public.ic_timesheets;
CREATE POLICY "RBAC ic_timesheets SELECT" ON public.ic_timesheets 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('my_timesheets') IN ('full', 'read_only')
);

-- 3. Leave Requests
DROP POLICY IF EXISTS "RBAC ic_leave_requests SELECT" ON public.ic_leave_requests;
CREATE POLICY "RBAC ic_leave_requests SELECT" ON public.ic_leave_requests 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('my_leave') IN ('full', 'read_only')
);

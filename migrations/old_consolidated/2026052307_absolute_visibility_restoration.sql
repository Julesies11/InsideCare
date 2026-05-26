-- ABSOLUTE VISIBILITY RESTORATION
-- This migration restores all missing staff data policies and enables
-- manager visibility without recursion.

-- 1. Enable Manager Visibility on Assignments
-- Managers (context_read) need to see other staff assignments to know who they manage.
DROP POLICY IF EXISTS "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments;
CREATE POLICY "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('employees') IN ('full', 'read_only', 'context_read_write', 'context_read_only')
);

-- 2. Restore Staff Data Policies (The Missing Policies)
DROP POLICY IF EXISTS "RBAC staff_shifts SELECT" ON public.ic_staff_shifts;
CREATE POLICY "RBAC staff_shifts SELECT" ON public.ic_staff_shifts 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('employees') IN ('full', 'read_only')
);

DROP POLICY IF EXISTS "RBAC timesheets SELECT" ON public.ic_timesheets;
CREATE POLICY "RBAC timesheets SELECT" ON public.ic_timesheets 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('timesheets') IN ('full', 'read_only')
);

DROP POLICY IF EXISTS "RBAC leave_requests SELECT" ON public.ic_leave_requests;
CREATE POLICY "RBAC leave_requests SELECT" ON public.ic_leave_requests 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = public.ic_jwt_get_staff_id() OR 
  public.ic_jwt_get_perm('leave_requests') IN ('full', 'read_only')
);

-- 3. Restore Participant Visibility
DROP POLICY IF EXISTS "RBAC participants SELECT" ON public.ic_participants;
CREATE POLICY "RBAC participants SELECT" ON public.ic_participants 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  public.ic_jwt_get_perm('participants') IN ('full', 'read_only') OR 
  public.ic_jwt_has_house_internal(house_id)
);

-- 4. Restore Master List Visibility (Standard roles need to see enums/types for the UI to render)
DROP POLICY IF EXISTS "RBAC checklist_master SELECT" ON public.ic_checklist_master;
CREATE POLICY "RBAC checklist_master SELECT" ON public.ic_checklist_master FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC leave_types SELECT" ON public.ic_leave_types;
CREATE POLICY "RBAC leave_types SELECT" ON public.ic_leave_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC departments SELECT" ON public.ic_departments;
CREATE POLICY "RBAC departments SELECT" ON public.ic_departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC employment_types_master SELECT" ON public.ic_employment_types_master;
CREATE POLICY "RBAC employment_types_master SELECT" ON public.ic_employment_types_master FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC house_types_master SELECT" ON public.ic_house_types_master;
CREATE POLICY "RBAC house_types_master SELECT" ON public.ic_house_types_master FOR SELECT TO authenticated USING (true);

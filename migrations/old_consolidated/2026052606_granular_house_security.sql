-- Migration: Granular House Security RBAC (Verified & Audited)
-- Date: 2026-05-26
-- Description: Adds granular permission columns and UPDATES RLS policies to enforce them at the data layer.

BEGIN;

-- 1. Add new columns to ic_role_permissions
ALTER TABLE public.ic_role_permissions 
ADD COLUMN house_management ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN house_operations ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN house_checklist_history ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN house_resources ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN house_staff ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN house_activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum;

-- 2. Update ic_jwt_get_perm function to include new modules
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
  SELECT 
    CASE p_module
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      WHEN 'participants' THEN participants::text
      WHEN 'shift_notes' THEN shift_notes::text
      WHEN 'employees' THEN employees::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      WHEN 'roster_board' THEN roster_board::text
      WHEN 'houses' THEN houses::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'house_management' THEN house_management::text
      WHEN 'house_operations' THEN house_operations::text
      WHEN 'house_checklist_history' THEN house_checklist_history::text
      WHEN 'house_resources' THEN house_resources::text
      WHEN 'house_staff' THEN house_staff::text
      WHEN 'house_activity_log' THEN house_activity_log::text
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions rp
  JOIN public.ic_staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies to be Granular-Aware

-- ic_houses: Allow access if ANY relevant permission is granted
DROP POLICY IF EXISTS "RBAC houses SELECT" ON public.ic_houses;
CREATE POLICY "RBAC houses SELECT" ON public.ic_houses FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('houses') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_management') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_operations') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_staff') IN ('full', 'read_only', 'context_read_write', 'context_read_only')
);

DROP POLICY IF EXISTS "RBAC houses ALL" ON public.ic_houses;
CREATE POLICY "RBAC houses UPDATE" ON public.ic_houses FOR UPDATE TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('houses') = 'full' OR
    ic_jwt_get_perm('house_management') = 'full' OR
    ((ic_jwt_get_perm('houses') = 'context_read_write' OR ic_jwt_get_perm('house_management') = 'context_read_write') AND ic_jwt_has_house(id))
);

-- ic_house_comms: Check house_operations
DROP POLICY IF EXISTS "RBAC house_comms ALL" ON public.ic_house_comms;
CREATE POLICY "RBAC house_comms ALL" ON public.ic_house_comms FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('house_operations') = 'full' OR 
    ((ic_jwt_get_perm('house_operations') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

-- ic_house_files: Check house_resources
DROP POLICY IF EXISTS "RBAC house_files ALL" ON public.ic_house_files;
CREATE POLICY "RBAC house_files ALL" ON public.ic_house_files FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('house_resources') = 'full' OR 
    ((ic_jwt_get_perm('house_resources') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

-- ic_house_staff_assignments: Check house_staff
DROP POLICY IF EXISTS "RBAC house_staff_assignments ALL" ON public.ic_house_staff_assignments;
CREATE POLICY "RBAC house_staff_assignments ALL" ON public.ic_house_staff_assignments FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('house_staff') = 'full' OR 
    ((ic_jwt_get_perm('house_staff') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

COMMIT;

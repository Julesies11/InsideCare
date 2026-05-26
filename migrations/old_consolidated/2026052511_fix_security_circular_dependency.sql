-- Migration: Fix Security Circular Dependency
-- Date: 2026-05-25
-- Description: Marks security helper functions as SECURITY DEFINER to prevent circular RLS dependencies.

-- 1. Update ic_jwt_get_perm to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text)
RETURNS text 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
  -- This JOIN is now safe because of SECURITY DEFINER bypassing RLS on ic_staff and ic_role_permissions
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
$$ LANGUAGE plpgsql;

-- 2. Update ic_jwt_get_staff_id to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id()
RETURNS uuid 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Try JWT first
  BEGIN
    v_staff_id := (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_staff_id := NULL;
  END;

  IF v_staff_id IS NOT NULL THEN
    RETURN v_staff_id;
  END IF;

  -- Fallback to database lookup
  SELECT id INTO v_staff_id 
  FROM public.ic_staff 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;

  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Update ic_jwt_is_admin to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.ic_jwt_is_admin()
RETURNS bool 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true OR
    public.ic_jwt_get_perm('access_control') = 'full'
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Update ic_jwt_manages_staff to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.ic_jwt_manages_staff(p_staff_id uuid)
RETURNS bool 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Admin always manages everyone
  IF public.ic_jwt_is_admin() THEN
    RETURN true;
  END IF;

  -- Staff member manages themselves
  IF p_staff_id = public.ic_jwt_get_staff_id() THEN
    RETURN true;
  END IF;

  -- Managers can see staff in houses they are assigned to
  RETURN EXISTS (
    SELECT 1 
    FROM public.ic_house_staff_assignments hsa_target
    JOIN public.ic_house_staff_assignments hsa_manager ON hsa_manager.house_id = hsa_target.house_id
    WHERE hsa_target.staff_id = p_staff_id
    AND hsa_manager.staff_id = public.ic_jwt_get_staff_id()
    AND public.ic_jwt_get_perm('employees') IN ('context_read_write', 'context_read_only')
  );
END;
$$ LANGUAGE plpgsql;

-- 5. UPGRADE: Add missing Roster Management policy for ic_staff_shifts
-- This allows non-admins (e.g. House Managers) with roster_board permissions to manage shifts.
DROP POLICY IF EXISTS "RBAC ic_staff_shifts - Roster Manager" ON public.ic_staff_shifts;
CREATE POLICY "RBAC ic_staff_shifts - Roster Manager" 
ON public.ic_staff_shifts FOR ALL
USING (
    ic_jwt_get_perm('roster_board') = 'full' OR
    (ic_jwt_get_perm('roster_board') = 'context_read_write' AND ic_jwt_has_house(house_id))
);

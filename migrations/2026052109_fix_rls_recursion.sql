-- Migration: Fix RLS recursion
-- Description: Modifies RLS helper functions to use SECURITY DEFINER, preventing infinite recursion (stack depth limit exceeded) when querying tables like ic_staff.

-- 1. Fix ic_jwt_get_perm
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perm_text text;
BEGIN
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

  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  RETURN COALESCE(auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module, 'none');
END;
$$;

-- 2. Fix ic_jwt_get_staff_id
CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  v_staff_id := (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
  IF v_staff_id IS NOT NULL THEN
    RETURN v_staff_id;
  END IF;
  SELECT id INTO v_staff_id FROM public.ic_staff WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_staff_id;
END;
$$;

-- 3. Fix ic_jwt_has_house
CREATE OR REPLACE FUNCTION public.ic_jwt_has_house(p_house_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ic_house_staff_assignments hsa
    JOIN public.ic_staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
    AND hsa.house_id = p_house_id
    AND (hsa.end_date IS NULL OR hsa.end_date > now())
  ) THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- 4. Fix ic_jwt_manages_staff
CREATE OR REPLACE FUNCTION public.ic_jwt_manages_staff(p_staff_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' -> 'managed_staff_ids') @> jsonb_build_array(p_staff_id::text) THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ic_staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = (SELECT manager_id FROM public.ic_staff WHERE id = p_staff_id)
  ) THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- 5. Fix ic_jwt_is_admin
CREATE OR REPLACE FUNCTION public.ic_jwt_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true OR
    ic_jwt_get_perm('access_control') = 'full'
  );
END;
$$;

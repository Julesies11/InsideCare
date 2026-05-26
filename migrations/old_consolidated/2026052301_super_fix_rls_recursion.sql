-- SUPER-FIX for Infinite RLS Recursion
-- This migration hardens all JWT/RBAC functions against infinite loops by using SECURITY DEFINER.

-- 1. Fix ic_jwt_get_perm (The primary source of the loop)
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) 
RETURNS text 
SECURITY DEFINER
SET search_path = public
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
  -- This JOIN is safe because of SECURITY DEFINER bypassing RLS on ic_staff and ic_role_permissions
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

-- 2. Fix ic_jwt_is_admin
CREATE OR REPLACE FUNCTION public.ic_jwt_is_admin() 
RETURNS bool 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true OR
    public.ic_jwt_get_perm('access_control') = 'full'
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure ic_jwt_get_staff_id is also fully hardened
CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id() 
RETURNS uuid 
SECURITY DEFINER
SET search_path = public
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

-- 4. Re-verify ic_roles SELECT policy
DROP POLICY IF EXISTS "RBAC roles SELECT" ON public.ic_roles;
CREATE POLICY "RBAC roles SELECT" ON public.ic_roles 
FOR SELECT TO authenticated 
USING (true);

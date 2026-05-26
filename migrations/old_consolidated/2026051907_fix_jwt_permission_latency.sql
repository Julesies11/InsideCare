-- Migration: Fix JWT Permission Latency
-- Date: 2026-05-19
-- Description: Prioritizes the Database (role_permissions) over the JWT (app_metadata).
-- This ensures that role changes made by Admins are INSTANT and don't require users to log out.

CREATE OR REPLACE FUNCTION public.jwt_get_perm(p_module text) RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- 1. DATABASE SOURCE OF TRUTH (Highest Priority)
  -- We query the live table first to ensure instant enforcement of Admin changes.
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
  FROM public.role_permissions rp
  JOIN public.staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  -- 2. RETURN DATABASE VALUE IF FOUND
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- 3. JWT FALLBACK (Only used if the user record isn't fully set up yet)
  RETURN COALESCE(auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

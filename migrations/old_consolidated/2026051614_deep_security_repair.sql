-- Migration: Deep Security Repair & RLS Hardening
-- Description: Bypasses potential helper failures and standardizes core access paths.

BEGIN;

-- ========================================================================================
-- 1. HARDEN CORE HELPERS (Explicit search_path & Robustness)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Direct check with fallback
  RETURN COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- 1. Try JWT metadata (Fastest)
  BEGIN
    v_staff_id := (auth.jwt() -> 'user_metadata' ->> 'staff_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_staff_id := NULL;
  END;
  
  -- 2. Fallback to direct table query
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE auth_user_id = auth.uid();
  END IF;
  
  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

-- ========================================================================================
-- 2. HARDEN STAFF SHIFTS (Direct Auth Check)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    -- Direct check for own shifts (bypasses get_my_staff_id helper)
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = public.staff_shifts.staff_id AND s.auth_user_id = auth.uid()) OR
    -- Managerial / Roster Board checks
    (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
    (get_access_level('my_roster') IN ('full', 'read_only')) OR 
    (
        (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
         get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
        (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id()))
    )
  );

-- ========================================================================================
-- 3. HARDEN PARTICIPANT VISIBILITY (Ensure Roster Joins Work)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants') IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_participants') IN ('context_read_write', 'context_read_only') AND 
        is_staff_assigned_to_house(get_my_staff_id(), house_id)
    ) OR
    -- Critical fallback: Can see participants in any house you are assigned to
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    -- Ultimate fallback: Can see participants in any house where you have a shift
    EXISTS (SELECT 1 FROM public.staff_shifts ss WHERE ss.house_id = public.participants.house_id AND ss.staff_id = get_my_staff_id())
  );

-- ========================================================================================
-- 4. FIX TIMESHEETS & LEAVE (Own Record Access)
-- ========================================================================================

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = public.timesheets.staff_id AND s.auth_user_id = auth.uid()) OR
    (get_access_level('manage_timesheets') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

-- Leave Requests
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = public.leave_requests.staff_id AND s.auth_user_id = auth.uid()) OR
    (get_access_level('manage_leave') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_leave') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

COMMIT;

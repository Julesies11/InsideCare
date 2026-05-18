-- Migration: Fix RBAC Gaps & Harden Roster Access
-- Description: Standardizes RLS policies to use current RBAC column names and hardens roster visibility.

BEGIN;

-- ========================================================================================
-- 1. HARDEN HELPERS
-- ========================================================================================

-- Update get_access_level to be even more robust with a mapping for legacy names
CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_mapped_module text;
  v_perm_text text;
  v_role_id uuid;
BEGIN
  -- 1. Map legacy names to current canonical ones
  v_mapped_module := CASE module_name
    WHEN 'staff_profiles' THEN 'manage_staff'
    WHEN 'participant_profiles' THEN 'manage_participants'
    WHEN 'house_profiles' THEN 'manage_houses'
    WHEN 'roster_board' THEN 'manage_roster_board'
    WHEN 'timesheets_approve' THEN 'manage_timesheets'
    WHEN 'timesheets_submit' THEN 'my_timesheets'
    WHEN 'house_checklists' THEN 'execute_house_checklists'
    WHEN 'shift_routines' THEN 'execute_shift_routines'
    WHEN 'shift_notes' THEN 'write_shift_notes'
    WHEN 'participant_notes' THEN 'write_shift_notes' -- Fallback
    WHEN 'documents' THEN 'manage_master_lists' -- Approximate
    WHEN 'leave_requests' THEN 'manage_leave'
    ELSE module_name
  END;

  -- 2. Try JWT metadata (Fastest)
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> v_mapped_module;
  
  -- 3. Fallback to Database (Necessary for stale sessions or missing keys)
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', v_mapped_module)
      INTO v_perm_text
      USING v_role_id;
    END IF;
  END IF;

  -- Transition shim for old enum values
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. REBUILD ROSTER POLICIES (Hardened & Context-Aware)
-- ========================================================================================

-- Staff Shifts (Standardized SELECT)
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
    (get_access_level('my_roster') IN ('full', 'read_only')) OR 
    (
        (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
         get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
        (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id()))
    )
  );

-- Shift Participants (Fixing Manager Gap)
DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.staff_shifts ss 
      WHERE ss.id = public.shift_participants.shift_id 
      AND (
        ss.staff_id = get_my_staff_id() OR 
        is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR
        is_staff_managed_by(ss.staff_id, get_my_staff_id())
      )
    )
  );

-- Shift Assigned Checklists (Fixing Manager Gap)
DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.staff_shifts ss 
      WHERE ss.id = public.shift_assigned_checklists.shift_id 
      AND (
        ss.staff_id = get_my_staff_id() OR 
        is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR
        is_staff_managed_by(ss.staff_id, get_my_staff_id())
      )
    )
  );

-- ========================================================================================
-- 3. REBUILD CORE VISIBILITY (Standardized Column Names)
-- ========================================================================================

-- Staff visibility
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR 
    (get_access_level('manage_staff') IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_staff') IN ('context_read_write', 'context_read_only') AND 
        (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))
    )
  );

-- Participant visibility
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants') IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_participants') IN ('context_read_write', 'context_read_only') AND 
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    ) OR
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) -- Explicit fallback for Support Workers
  );

-- ========================================================================================
-- 4. CLEANUP LEGACY POLICY NAMES (If any remain)
-- ========================================================================================

-- Ensure timesheets use manage_timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_timesheets') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

COMMIT;

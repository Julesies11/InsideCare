-- Migration: Comprehensive RBAC Polish & Final Fixes
-- Description: Final standardization of RLS policies, fixing missing SELECTs and legacy mappings.

BEGIN;

-- ========================================================================================
-- 1. STANDARDIZE HELPERS
-- ========================================================================================

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
    WHEN 'participant_notes' THEN 'write_shift_notes'
    WHEN 'documents' THEN 'manage_master_lists'
    WHEN 'leave_requests' THEN 'manage_leave'
    WHEN 'house_documents' THEN 'manage_houses'
    WHEN 'participant_documents' THEN 'manage_participants'
    WHEN 'staff_documents' THEN 'manage_staff'
    ELSE module_name
  END;

  -- 2. Try JWT metadata (Fastest)
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> v_mapped_module;
  
  -- 3. Fallback to Database (Necessary for stale sessions)
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', v_mapped_module)
      INTO v_perm_text
      USING v_role_id;
    END IF;
  END IF;

  -- Transition shim
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. FIX MISSING & BROKEN SELECT POLICIES
-- ========================================================================================

-- Timesheets (Was missing SELECT entirely)
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_timesheets') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

-- House Resources (Standardize on helpers)
DROP POLICY IF EXISTS "Staff select house resources" ON public.house_resources;
CREATE POLICY "RBAC House Resources SELECT" ON public.house_resources
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses') IN ('full', 'read_only')) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

-- House Files (Standardize names)
DROP POLICY IF EXISTS "RBAC House Files SELECT" ON public.house_files;
CREATE POLICY "RBAC House Files SELECT" ON public.house_files
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses') IN ('full', 'read_only')) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

-- ========================================================================================
-- 3. HARDEN ROSTER JUNCTION TABLES
-- ========================================================================================

-- Shift Participants (Alignment with staff_shifts)
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
        (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
        (get_access_level('my_roster') IN ('full', 'read_only')) OR 
        (
            (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
             get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
            (is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR is_staff_managed_by(ss.staff_id, get_my_staff_id()))
        )
      )
    )
  );

-- Shift Assigned Checklists (Alignment with staff_shifts)
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
        (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
        (get_access_level('my_roster') IN ('full', 'read_only')) OR 
        (
            (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
             get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
            (is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR is_staff_managed_by(ss.staff_id, get_my_staff_id()))
        )
      )
    )
  );

-- ========================================================================================
-- 4. HARDEN CLINICAL VISIBILITY (Standardized Names)
-- ========================================================================================

-- Medications
DROP POLICY IF EXISTS "RBAC Medications SELECT" ON public.participant_medications;
CREATE POLICY "RBAC Medications SELECT" ON public.participant_medications
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants') IN ('full', 'read_only')) OR 
    is_staff_assigned_to_house(get_my_staff_id(), (SELECT house_id FROM participants p WHERE p.id = participant_id))
  );

-- Shift Notes
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('write_shift_notes') IN ('full', 'read_only')) OR 
    (staff_id = get_my_staff_id()) OR 
    ((get_access_level('write_shift_notes') IN ('context_read_write', 'context_read_only')) AND (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id())))
  );

COMMIT;

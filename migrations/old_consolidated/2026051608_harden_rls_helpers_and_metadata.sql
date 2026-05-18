-- Migration: Harden RLS Helpers & Metadata
-- Description: Fixes infinite recursion and stale metadata issues by making helpers SECURITY DEFINER and improving sync.

BEGIN;

-- ========================================================================================
-- 1. HARDEN HELPERS (Make SECURITY DEFINER to break RLS recursion)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- 1. Try JWT metadata (Fastest)
  v_staff_id := (auth.jwt() -> 'user_metadata' ->> 'staff_id')::uuid;
  
  -- 2. Fallback to table query
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE auth_user_id = auth.uid();
  END IF;
  
  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_perm_text text;
  v_role_id uuid;
BEGIN
  -- 1. Try JWT metadata (Fastest)
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name;
  
  -- 2. Fallback to Database (Necessary for stale sessions)
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', module_name)
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
-- 2. IMPROVE METADATA SYNC (Include staff_id)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'my_roster', my_roster,
    'my_timesheets', my_timesheets,
    'my_leave', my_leave,
    'manage_staff', manage_staff,
    'manage_participants', manage_participants,
    'manage_houses', manage_houses,
    'manage_roster_board', manage_roster_board,
    'manage_timesheets', manage_timesheets,
    'manage_leave', manage_leave,
    'manage_role_permissions', manage_role_permissions,
    'manage_master_lists', manage_master_lists,
    'view_activity_log', view_activity_log,
    'execute_house_checklists', execute_house_checklists,
    'execute_shift_routines', execute_shift_routines,
    'write_shift_notes', write_shift_notes
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'staff_id', NEW.id, -- Include staff_id
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'my_roster', my_roster,
    'my_timesheets', my_timesheets,
    'my_leave', my_leave,
    'manage_staff', manage_staff,
    'manage_participants', manage_participants,
    'manage_houses', manage_houses,
    'manage_roster_board', manage_roster_board,
    'manage_timesheets', manage_timesheets,
    'manage_leave', manage_leave,
    'manage_role_permissions', manage_role_permissions,
    'manage_master_lists', manage_master_lists,
    'view_activity_log', view_activity_log,
    'execute_house_checklists', execute_house_checklists,
    'execute_shift_routines', execute_shift_routines,
    'write_shift_notes', write_shift_notes
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'staff_id', v_staff_record.id, -- Include staff_id
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================================
-- 3. REBUILD CORE POLICIES (Hardened & Clean)
-- ========================================================================================

-- Staff
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR 
    (get_access_level('manage_staff'::text) IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_staff'::text) IN ('context_read_write', 'context_read_only') AND 
        (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))
    )
  );

-- Staff Shifts
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_roster_board'::text) IN ('full', 'read_only')) OR 
    (get_access_level('my_roster'::text) IN ('full', 'read_only')) OR -- Explicitly check my_roster
    ((get_access_level('manage_roster_board'::text) IN ('context_read_write', 'context_read_only')) AND (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id())))
  );

COMMIT;

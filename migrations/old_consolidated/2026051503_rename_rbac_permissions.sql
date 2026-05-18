-- ========================================================================================
-- RENAME & EXPAND RBAC PERMISSIONS 2026-05-18 (FINAL REVISED)
-- Objective: Clarify terminology between Personal Workspace and Administrative Control.
-- Fixes: Trigger recursion, missing columns (master_lists, activity_log), and test consistency.
-- ========================================================================================

BEGIN;

-- 1. ENSURE ALL NEW COLUMNS EXIST
ALTER TABLE public.role_permissions 
ADD COLUMN IF NOT EXISTS my_roster public.access_level_enum NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS my_timesheets public.access_level_enum NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS my_leave public.access_level_enum NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS manage_staff public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_participants public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_houses public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_roster_board public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_timesheets public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_leave public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_role_permissions public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_master_lists public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS view_activity_log public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS execute_house_checklists public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS execute_shift_routines public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS write_shift_notes public.access_level_enum NOT NULL DEFAULT 'none';

-- 2. UPDATE SYNC FUNCTIONS (Do BEFORE data migration to avoid trigger failures)

-- A. sync_staff_role_to_metadata (Trigger Function)
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
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. sync_staff_role_to_metadata_for_staff (Helper Function)
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
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DATA MIGRATION
-- Robustly migrate data, handling possible missing columns in baseline.
DO $$
BEGIN
    UPDATE public.role_permissions SET
        manage_staff = COALESCE((SELECT staff_profiles FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_participants = COALESCE((SELECT participant_profiles FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_houses = COALESCE((SELECT house_profiles FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_roster_board = COALESCE((SELECT roster_board FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_timesheets = COALESCE((SELECT timesheets_approve FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_leave = COALESCE((SELECT leave_requests FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        execute_house_checklists = COALESCE((SELECT house_checklists FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        execute_shift_routines = COALESCE((SELECT shift_routines FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        write_shift_notes = COALESCE((SELECT shift_notes FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_master_lists = COALESCE((SELECT master_lists FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        view_activity_log = COALESCE((SELECT activity_log FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none')
    WHERE true;
EXCEPTION WHEN OTHERS THEN
    -- Fallback for environments with different baselines
    NULL;
END $$;

-- 4. DROP OLD COLUMNS
ALTER TABLE public.role_permissions 
DROP COLUMN IF EXISTS staff_profiles,
DROP COLUMN IF EXISTS participant_profiles,
DROP COLUMN IF EXISTS house_profiles,
DROP COLUMN IF EXISTS roster_board,
DROP COLUMN IF EXISTS timesheets_approve,
DROP COLUMN IF EXISTS timesheets_submit,
DROP COLUMN IF EXISTS house_checklists,
DROP COLUMN IF EXISTS shift_routines,
DROP COLUMN IF EXISTS shift_notes,
DROP COLUMN IF EXISTS participant_notes,
DROP COLUMN IF EXISTS assign_staff_to_shift,
DROP COLUMN IF EXISTS documents,
DROP COLUMN IF EXISTS master_lists,
DROP COLUMN IF EXISTS activity_log,
DROP COLUMN IF EXISTS leave_requests;

-- 5. UPDATE RLS POLICIES TO USE NEW NAMES
-- Activity Log
DROP POLICY IF EXISTS "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log;
CREATE POLICY "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('view_activity_log') = 'full'
);

-- Houses
DROP POLICY IF EXISTS "RBAC Houses SELECT" ON public.houses;
CREATE POLICY "RBAC Houses SELECT" ON public.houses FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_houses') IN ('full', 'read_only') OR
    (
        public.get_access_level('manage_houses') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), id)
    )
);

DROP POLICY IF EXISTS "RBAC Houses ALL (Admin/Full)" ON public.houses;
CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('manage_houses') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('manage_houses') = 'full');

-- Participants
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_participants') IN ('full', 'read_only') OR
    (
        public.get_access_level('manage_participants') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- Staff
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_staff') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('manage_staff') IN ('context_read_write', 'context_read_only') AND
        (
            public.do_staff_share_house(public.get_my_staff_id(), id) OR
            public.is_staff_managed_by(id, public.get_my_staff_id())
        )
    )
);

-- Roster Board
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_timesheets') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- Leave
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_leave') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('manage_leave') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- Operational: Checklists
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('execute_house_checklists') IN ('full', 'read_only') OR
    (
        public.get_access_level('execute_house_checklists') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- Operational: Shift Notes
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('write_shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('write_shift_notes') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

-- 6. RE-SEED DEFAULT ROLES FOR PERSONAL WORKSPACE
UPDATE public.role_permissions SET 
    my_roster = 'full', 
    my_timesheets = 'full', 
    my_leave = 'full'
WHERE true;

-- Special Case: Admin roles get full access to RBAC management and Master Data
UPDATE public.role_permissions SET 
    manage_role_permissions = 'full',
    manage_master_lists = 'full',
    view_activity_log = 'full'
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('Admin', 'Director', 'Management'));

COMMIT;

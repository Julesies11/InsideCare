-- ========================================================================================
-- RENAME RBAC PERMISSIONS TO NOUNS (UI ALIGNMENT)
-- Date: 2026-05-18
-- ========================================================================================

BEGIN;

-- 1. ADD NEW NOUN-BASED COLUMNS
ALTER TABLE public.role_permissions 
ADD COLUMN IF NOT EXISTS employees public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS participants public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS houses public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS roster_board public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS timesheets public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS leave_requests public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS access_control public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS master_lists public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS activity_log public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS shift_routines public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS house_checklists public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS shift_notes public.access_level_enum NOT NULL DEFAULT 'none';

-- 2. UPDATE SYNC TRIGGER FUNCTIONS
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
    'employees', employees,
    'participants', participants,
    'houses', houses,
    'roster_board', roster_board,
    'timesheets', timesheets,
    'leave_requests', leave_requests,
    'access_control', access_control,
    'master_lists', master_lists,
    'activity_log', activity_log,
    'shift_routines', shift_routines,
    'house_checklists', house_checklists,
    'shift_notes', shift_notes
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
    'employees', employees,
    'participants', participants,
    'houses', houses,
    'roster_board', roster_board,
    'timesheets', timesheets,
    'leave_requests', leave_requests,
    'access_control', access_control,
    'master_lists', master_lists,
    'activity_log', activity_log,
    'shift_routines', shift_routines,
    'house_checklists', house_checklists,
    'shift_notes', shift_notes
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

-- 3. MIGRATE DATA FROM OLD VERB-BASED COLUMNS
-- This update will fire trigger_propagate_role_permission_changes, which will now
-- use the newly defined sync_staff_role_to_metadata_for_staff above.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_staff') THEN
    EXECUTE 'UPDATE public.role_permissions SET
        employees = manage_staff,
        participants = manage_participants,
        houses = manage_houses,
        roster_board = manage_roster_board,
        timesheets = manage_timesheets,
        leave_requests = manage_leave,
        access_control = manage_role_permissions,
        master_lists = manage_master_lists,
        activity_log = view_activity_log,
        shift_routines = execute_shift_routines,
        house_checklists = execute_house_checklists,
        shift_notes = write_shift_notes
    WHERE true';
  END IF;
END $$;

-- Ensure all existing staff metadata is forcefully synced to be absolutely sure
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN SELECT id FROM public.staff LOOP 
    PERFORM public.sync_staff_role_to_metadata_for_staff(r.id); 
  END LOOP; 
END $$;


-- 4. UPDATE get_access_level TO USE NEW NOUN NAMES DIRECTLY
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

  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. UPDATE RLS POLICIES TO USE NEW NAMES (OPTIONAL BUT CLEANER)
-- Note: get_access_level mapping handles this, but we update explicit ones for clarity.

-- Activity Log
DROP POLICY IF EXISTS "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log;
CREATE POLICY "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('activity_log') = 'full'
);

-- Houses
DROP POLICY IF EXISTS "RBAC Houses SELECT" ON public.houses;
CREATE POLICY "RBAC Houses SELECT" ON public.houses FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('houses') IN ('full', 'read_only') OR
    (
        public.get_access_level('houses') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), id)
    )
);

DROP POLICY IF EXISTS "RBAC Houses ALL (Admin/Full)" ON public.houses;
CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('houses') = 'full'
);

-- Participants
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participants') IN ('full', 'read_only') OR
    (
        public.get_access_level('participants') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    ) OR
    -- Always allow staff to see participants in their assigned houses or current shift
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR 
    EXISTS (
        SELECT 1 FROM public.staff_shifts ss 
        WHERE ss.house_id = participants.house_id AND ss.staff_id = public.get_my_staff_id()
    )
);

-- Staff
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    (auth_user_id = auth.uid()) OR
    public.get_access_level('employees') IN ('full', 'read_only') OR
    (
        public.get_access_level('employees') IN ('context_read_write', 'context_read_only') AND
        (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))
    )
);

-- Roster Board
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_shifts.staff_id AND s.auth_user_id = auth.uid())) OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    public.get_access_level('my_roster') IN ('full', 'read_only') OR
    (
        (public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only') OR public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND
        (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))
    )
);

-- Leave Requests
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = leave_requests.staff_id AND s.auth_user_id = auth.uid())) OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    (
        public.get_access_level('leave_requests') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated
USING (
    public.is_admin() OR 
    (staff_id = public.get_my_staff_id()) OR 
    public.get_access_level('timesheets') IN ('full', 'read_only') OR 
    (
        public.get_access_level('timesheets') IN ('context_read_write', 'context_read_only') AND 
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- 6. DROP OLD VERB-BASED COLUMNS
ALTER TABLE public.role_permissions 
DROP COLUMN IF EXISTS manage_staff,
DROP COLUMN IF EXISTS manage_participants,
DROP COLUMN IF EXISTS manage_houses,
DROP COLUMN IF EXISTS manage_roster_board,
DROP COLUMN IF EXISTS manage_timesheets,
DROP COLUMN IF EXISTS manage_leave,
DROP COLUMN IF EXISTS manage_role_permissions,
DROP COLUMN IF EXISTS manage_master_lists,
DROP COLUMN IF EXISTS view_activity_log,
DROP COLUMN IF EXISTS execute_shift_routines,
DROP COLUMN IF EXISTS execute_house_checklists,
DROP COLUMN IF EXISTS write_shift_notes;

COMMIT;

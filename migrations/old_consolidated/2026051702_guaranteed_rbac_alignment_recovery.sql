-- ========================================================================================
-- NUCLEAR RBAC RECOVERY & NOUN ALIGNMENT (FIXED SYNTAX)
-- Date: 2026-05-18
-- ========================================================================================

BEGIN;

-- 1. ENSURE NEW NOUN-BASED COLUMNS EXIST
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

-- 2. REDEFINE SYNC FUNCTIONS (To ensure metadata uses new JSON keys)
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

-- 3. REDEFINE get_access_level (Clean Break)
CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_perm_text text;
  v_role_id uuid;
BEGIN
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name;
  
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', module_name)
      INTO v_perm_text USING v_role_id;
    END IF;
  END IF;

  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. SAFE DATA MIGRATION (Idempotent per-column migration)
DO $body$
BEGIN
  -- Employees
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_staff') THEN
    UPDATE public.role_permissions SET employees = manage_staff WHERE employees = 'none';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='staff_profiles') THEN
    UPDATE public.role_permissions SET employees = staff_profiles WHERE employees = 'none';
  END IF;

  -- Participants
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_participants') THEN
    UPDATE public.role_permissions SET participants = manage_participants WHERE participants = 'none';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='participant_profiles') THEN
    UPDATE public.role_permissions SET participants = participant_profiles WHERE participants = 'none';
  END IF;

  -- Houses
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_houses') THEN
    UPDATE public.role_permissions SET houses = manage_houses WHERE houses = 'none';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='house_profiles') THEN
    UPDATE public.role_permissions SET houses = house_profiles WHERE houses = 'none';
  END IF;

  -- Master Lists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_master_lists') THEN
    UPDATE public.role_permissions SET master_lists = manage_master_lists WHERE master_lists = 'none';
  END IF;

  -- Timesheets
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_timesheets') THEN
    UPDATE public.role_permissions SET timesheets = manage_timesheets WHERE timesheets = 'none';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='timesheets_approve') THEN
    UPDATE public.role_permissions SET timesheets = timesheets_approve WHERE timesheets = 'none';
  END IF;

  -- Leave Requests
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_leave') THEN
    UPDATE public.role_permissions SET leave_requests = manage_leave WHERE leave_requests = 'none';
  END IF;

  -- Roster Board
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_roster_board') THEN
    UPDATE public.role_permissions SET roster_board = manage_roster_board WHERE roster_board = 'none';
  END IF;

  -- Access Control
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='manage_role_permissions') THEN
    UPDATE public.role_permissions SET access_control = manage_role_permissions WHERE access_control = 'none';
  END IF;

  -- Activity Log
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='view_activity_log') THEN
    UPDATE public.role_permissions SET activity_log = view_activity_log WHERE activity_log = 'none';
  END IF;

  -- Shift Routines
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='execute_shift_routines') THEN
    UPDATE public.role_permissions SET shift_routines = execute_shift_routines WHERE shift_routines = 'none';
  END IF;

  -- House Checklists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='execute_house_checklists') THEN
    UPDATE public.role_permissions SET house_checklists = execute_house_checklists WHERE house_checklists = 'none';
  END IF;

  -- Shift Notes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_permissions' AND column_name='write_shift_notes') THEN
    UPDATE public.role_permissions SET shift_notes = write_shift_notes WHERE shift_notes = 'none';
  END IF;
END $body$;

-- 5. SYSTEM-WIDE RLS ALIGNMENT
-- MASTER LISTS
DO $body$
DECLARE
    t text;
    tables text[] := ARRAY[
        'branches', 'checklist_item_master', 'checklist_master', 'contact_types_master', 
        'departments', 'employment_types_master', 'funding_sources_master', 'funding_types_master', 
        'house_calendar_event_types_master', 'leave_types', 'medications_master', 'positions', 
        'providers', 'roles', 'services'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (public.is_admin() OR (public.get_access_level(''master_lists'') = ''full''))', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I SELECT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    END LOOP;
END $body$;

-- HOUSES & CALENDAR
DROP POLICY IF EXISTS "RBAC Houses ALL (Admin/Full)" ON public.houses;
CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full');

DROP POLICY IF EXISTS "RBAC Houses SELECT" ON public.houses;
CREATE POLICY "RBAC Houses SELECT" ON public.houses FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR (public.get_access_level('houses') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), id)));

DROP POLICY IF EXISTS "RBAC House Comms ALL" ON public.house_comms;
CREATE POLICY "RBAC House Comms ALL" ON public.house_comms FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));

DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;
CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), id)));

-- PARTICIPANTS
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('participants') IN ('full', 'read_only') OR (public.get_access_level('participants') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)) OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR (EXISTS (SELECT 1 FROM staff_shifts ss WHERE ss.house_id = participants.house_id AND ss.staff_id = public.get_my_staff_id())));

DO $body$
DECLARE
    t text;
    tables text[] := ARRAY[
        'participant_contacts', 'participant_funding', 'participant_goals', 
        'participant_hygiene_routines', 'participant_medications', 
        'participant_notes', 'participant_restrictive_practices'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL (Full/Context)" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL (Full/Context)" ON public.%I FOR ALL TO authenticated 
            USING (public.is_admin() OR (public.get_access_level(''participants'') = ''full'') OR ((public.get_access_level(''participants'') = ''context_read_write'') AND (EXISTS (SELECT 1 FROM participants p WHERE p.id = public.%I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))))', t, t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I SELECT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated 
            USING (public.is_admin() OR (public.get_access_level(''participants'') IN (''full'', ''read_only'')) OR ((public.get_access_level(''participants'') IN (''context_read_write'', ''context_read_only'')) AND (EXISTS (SELECT 1 FROM participants p WHERE p.id = public.%I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))))', t, t, t);
    END LOOP;
END $body$;

-- participant_goal_progress (Special case: join via goal_id)
DROP POLICY IF EXISTS "RBAC participant_goal_progress ALL (Full/Context)" ON public.participant_goal_progress;
CREATE POLICY "RBAC participant_goal_progress ALL (Full/Context)" ON public.participant_goal_progress FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('participants') = 'full') OR ((public.get_access_level('participants') = 'context_read_write') AND (EXISTS (SELECT 1 FROM participant_goals pg JOIN participants p ON p.id = pg.participant_id WHERE pg.id = goal_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))));

-- EMPLOYEES & HR
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff FOR SELECT TO authenticated USING (public.is_admin() OR (auth_user_id = auth.uid()) OR (public.get_access_level('employees') IN ('full', 'read_only')) OR ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))));

DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_shifts.staff_id AND s.auth_user_id = auth.uid())) OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

-- TIMESHEETS & LEAVE
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated USING (public.is_admin() OR (staff_id = public.get_my_staff_id()) OR (public.get_access_level('timesheets') IN ('full', 'read_only')) OR ((public.get_access_level('timesheets') IN ('context_read_write', 'context_read_only')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM staff s WHERE s.id = leave_requests.staff_id AND s.auth_user_id = auth.uid())) OR (public.get_access_level('leave_requests') IN ('full', 'read_only')) OR ((public.get_access_level('leave_requests') IN ('context_read_write', 'context_read_only')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

-- 6. FINAL CLEANUP (DROP LEGACY COLUMNS)
DO $body$
DECLARE
    col text;
    cols text[] := ARRAY[
        'manage_staff', 'manage_participants', 'manage_houses', 'manage_roster_board', 
        'manage_timesheets', 'manage_leave', 'manage_role_permissions', 'manage_master_lists', 
        'view_activity_log', 'execute_house_checklists', 'execute_shift_routines', 'write_shift_notes',
        'staff_profiles', 'participant_profiles', 'house_profiles', 'roster_board', 
        'timesheets_approve', 'timesheets_submit', 'house_checklists', 'shift_routines', 
        'shift_notes', 'participant_notes', 'assign_staff_to_shift', 'documents', 'leave_requests'
    ];
BEGIN
    FOREACH col IN ARRAY cols LOOP
        EXECUTE format('ALTER TABLE public.role_permissions DROP COLUMN IF EXISTS %I', col);
    END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $body$;

-- 7. GUARANTEED METADATA REBUILD
DO $body$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN SELECT id FROM public.staff LOOP 
    PERFORM public.sync_staff_role_to_metadata_for_staff(r.id); 
  END LOOP; 
END $body$;

COMMIT;

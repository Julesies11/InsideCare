-- ========================================================================================
-- RBAC RESET & REBUILD (THE NUCLEAR OPTION)
-- Date: 2026-05-18
-- ========================================================================================

BEGIN;

-- 1. DROP EVERYTHING RBAC-RELATED
DROP TRIGGER IF EXISTS trigger_sync_staff_role_to_metadata ON public.staff;
DROP TRIGGER IF EXISTS trigger_sync_staff_role_to_metadata_for_staff ON public.staff;
DROP TRIGGER IF EXISTS trigger_propagate_role_permission_changes ON public.role_permissions;
DROP FUNCTION IF EXISTS public.sync_staff_role_to_metadata();
DROP FUNCTION IF EXISTS public.sync_staff_role_to_metadata_for_staff(UUID);
DROP TABLE IF EXISTS public.role_permissions;

-- 2. CREATE FRESH ROLE_PERMISSIONS TABLE (PURE NOUNS)
CREATE TABLE public.role_permissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    role_id uuid NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
    
    -- Personal (Staff Portal)
    my_roster public.access_level_enum NOT NULL DEFAULT 'none',
    my_timesheets public.access_level_enum NOT NULL DEFAULT 'none',
    my_leave public.access_level_enum NOT NULL DEFAULT 'none',
    shift_routines public.access_level_enum NOT NULL DEFAULT 'none',
    
    -- Participant Records
    participants public.access_level_enum NOT NULL DEFAULT 'none',
    shift_notes public.access_level_enum NOT NULL DEFAULT 'none',
    
    -- Employees & HR
    employees public.access_level_enum NOT NULL DEFAULT 'none',
    timesheets public.access_level_enum NOT NULL DEFAULT 'none',
    leave_requests public.access_level_enum NOT NULL DEFAULT 'none',
    roster_board public.access_level_enum NOT NULL DEFAULT 'none',
    
    -- Operations & Facilities
    houses public.access_level_enum NOT NULL DEFAULT 'none',
    house_checklists public.access_level_enum NOT NULL DEFAULT 'none',
    
    -- System Administration
    access_control public.access_level_enum NOT NULL DEFAULT 'none',
    master_lists public.access_level_enum NOT NULL DEFAULT 'none',
    activity_log public.access_level_enum NOT NULL DEFAULT 'none',
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT role_permissions_role_id_key UNIQUE (role_id)
);

-- 3. POPULATE WITH DEFAULTS (Admin, Management, Director, Support Worker)
INSERT INTO public.role_permissions (role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log)
SELECT 
    id, 
    'full', 'full', 'full', 'full', -- Staff Portal
    'full', 'full',                 -- Participant Records
    'full', 'full', 'full', 'full', -- Employees & HR
    'full', 'full',                 -- Operations
    'full', 'full', 'full'          -- System Admin
FROM public.roles WHERE name IN ('Admin', 'Director');

INSERT INTO public.role_permissions (role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log)
SELECT 
    id, 
    'full', 'full', 'full', 'full',
    'context_read_write', 'context_read_write',
    'context_read_write', 'context_read_write', 'context_read_write', 'context_read_write',
    'context_read_write', 'context_read_write',
    'none', 'read_only', 'read_only'
FROM public.roles WHERE name = 'Management';

INSERT INTO public.role_permissions (role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log)
SELECT 
    id, 
    'full', 'full', 'full', 'full',
    'context_read_only', 'context_read_write',
    'context_read_only', 'none', 'none', 'none',
    'context_read_only', 'context_read_write',
    'none', 'none', 'none'
FROM public.roles WHERE name NOT IN ('Admin', 'Director', 'Management');

-- 4. RE-ESTABLISH SYNC FUNCTIONS
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  SELECT jsonb_build_object(
    'my_roster', my_roster, 'my_timesheets', my_timesheets, 'my_leave', my_leave, 'shift_routines', shift_routines,
    'participants', participants, 'shift_notes', shift_notes,
    'employees', employees, 'timesheets', timesheets, 'leave_requests', leave_requests, 'roster_board', roster_board,
    'houses', houses, 'house_checklists', house_checklists,
    'access_control', access_control, 'master_lists', master_lists, 'activity_log', activity_log
  ) INTO v_permissions FROM public.role_permissions WHERE role_id = NEW.role_id;
  
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role_name', v_role_name, 'permissions', COALESCE(v_permissions, '{}'::jsonb)) WHERE id = NEW.auth_user_id;
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
    'my_roster', my_roster, 'my_timesheets', my_timesheets, 'my_leave', my_leave, 'shift_routines', shift_routines,
    'participants', participants, 'shift_notes', shift_notes,
    'employees', employees, 'timesheets', timesheets, 'leave_requests', leave_requests, 'roster_board', roster_board,
    'houses', houses, 'house_checklists', house_checklists,
    'access_control', access_control, 'master_lists', master_lists, 'activity_log', activity_log
  ) INTO v_permissions FROM public.role_permissions WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role_name', v_role_name, 'permissions', COALESCE(v_permissions, '{}'::jsonb)) WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_staff_role_to_metadata AFTER INSERT OR UPDATE OF role_id ON public.staff FOR EACH ROW EXECUTE FUNCTION public.sync_staff_role_to_metadata();

-- 5. RE-ESTABLISH GET_ACCESS_LEVEL
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
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', module_name) INTO v_perm_text USING v_role_id;
    END IF;
  END IF;
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. APPLY ALL RLS POLICIES (ALIGNMENT)
DO $body$
DECLARE
    t text;
    tables text[] := ARRAY['branches', 'checklist_item_master', 'checklist_master', 'contact_types_master', 'departments', 'employment_types_master', 'funding_sources_master', 'funding_types_master', 'house_calendar_event_types_master', 'leave_types', 'medications_master', 'positions', 'providers', 'roles', 'services'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level(''master_lists'') = ''full''))', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I SELECT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    END LOOP;
END $body$;

-- Houses & Facilities
DROP POLICY IF EXISTS "RBAC Houses ALL (Admin/Full)" ON public.houses;
CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full');
DROP POLICY IF EXISTS "RBAC Houses SELECT" ON public.houses;
CREATE POLICY "RBAC Houses SELECT" ON public.houses FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR (public.get_access_level('houses') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), id)));

DROP POLICY IF EXISTS "RBAC House Comms ALL" ON public.house_comms;
CREATE POLICY "RBAC House Comms ALL" ON public.house_comms FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));
DROP POLICY IF EXISTS "RBAC House Comms SELECT" ON public.house_comms;
CREATE POLICY "RBAC House Comms SELECT" ON public.house_comms FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id));

DROP POLICY IF EXISTS "RBAC House Files ALL" ON public.house_files;
CREATE POLICY "RBAC House Files ALL" ON public.house_files FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full');
DROP POLICY IF EXISTS "RBAC House Files SELECT" ON public.house_files;
CREATE POLICY "RBAC House Files SELECT" ON public.house_files FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id));

DROP POLICY IF EXISTS "RBAC House Resources SELECT" ON public.house_resources;
CREATE POLICY "RBAC House Resources SELECT" ON public.house_resources FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id));

-- Calendar
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;
CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), id)));
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), id));

DROP POLICY IF EXISTS "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments;
CREATE POLICY "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR (EXISTS (SELECT 1 FROM house_calendar_events hce WHERE hce.id = event_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id))));

DROP POLICY IF EXISTS "RBAC Calendar Event Participants ALL" ON public.house_calendar_event_participants;
CREATE POLICY "RBAC Calendar Event Participants ALL" ON public.house_calendar_event_participants FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id)));
DROP POLICY IF EXISTS "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants;
CREATE POLICY "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id));

DROP POLICY IF EXISTS "RBAC Calendar Event Staff ALL" ON public.house_calendar_event_staff;
CREATE POLICY "RBAC Calendar Event Staff ALL" ON public.house_calendar_event_staff FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id)));
DROP POLICY IF EXISTS "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff;
CREATE POLICY "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR staff_id = public.get_my_staff_id() OR public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id));

-- Checklists
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists FOR SELECT TO authenticated USING (public.is_admin() OR is_global = true OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));

DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;
CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items FOR ALL TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklists hc WHERE hc.id = checklist_id AND (public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hc.house_id))))));
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklists hc WHERE hc.id = checklist_id AND (hc.is_global = true OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hc.house_id))))));

DROP POLICY IF EXISTS "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments;
CREATE POLICY "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.get_access_level('shift_routines') = 'full' OR (public.get_access_level('shift_routines') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id))))));
DROP POLICY IF EXISTS "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments;
CREATE POLICY "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.get_access_level('house_checklists') IN ('full', 'read_only') OR public.get_access_level('shift_routines') IN ('full', 'read_only') OR ((public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id))))));

-- Forms
DROP POLICY IF EXISTS "RBAC house_forms ALL (Admin/Full/Context)" ON public.house_forms;
CREATE POLICY "RBAC house_forms ALL (Admin/Full/Context)" ON public.house_forms FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM house_staff_assignments hsa WHERE hsa.house_id = public.house_forms.house_id AND hsa.staff_id = public.get_my_staff_id() AND (hsa.end_date IS NULL OR hsa.end_date > now()))));
DROP POLICY IF EXISTS "RBAC house_forms SELECT" ON public.house_forms;
CREATE POLICY "RBAC house_forms SELECT" ON public.house_forms FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM house_staff_assignments hsa WHERE hsa.house_id = public.house_forms.house_id AND hsa.staff_id = public.get_my_staff_id() AND (hsa.end_date IS NULL OR hsa.end_date > now()))));

DROP POLICY IF EXISTS "RBAC house_form_assignments ALL (Admin/Full/Context)" ON public.house_form_assignments;
CREATE POLICY "RBAC house_form_assignments ALL (Admin/Full/Context)" ON public.house_form_assignments FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));
DROP POLICY IF EXISTS "RBAC house_form_assignments SELECT" ON public.house_form_assignments;
CREATE POLICY "RBAC house_form_assignments SELECT" ON public.house_form_assignments FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));

DROP POLICY IF EXISTS "RBAC house_form_submissions ALL (Admin/Full/Context)" ON public.house_form_submissions;
CREATE POLICY "RBAC house_form_submissions ALL (Admin/Full/Context)" ON public.house_form_submissions FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));
DROP POLICY IF EXISTS "RBAC house_form_submissions SELECT" ON public.house_form_submissions;
CREATE POLICY "RBAC house_form_submissions SELECT" ON public.house_form_submissions FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));

-- Participants
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('participants') IN ('full', 'read_only') OR (public.get_access_level('participants') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)) OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR (EXISTS (SELECT 1 FROM staff_shifts ss WHERE ss.house_id = participants.house_id AND ss.staff_id = public.get_my_staff_id())));

DO $body$
DECLARE
    t text;
    tables text[] := ARRAY['participant_contacts', 'participant_funding', 'participant_goals', 'participant_hygiene_routines', 'participant_medications', 'participant_notes', 'participant_restrictive_practices'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL (Full/Context)" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL (Full/Context)" ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level(''participants'') = ''full'') OR ((public.get_access_level(''participants'') = ''context_read_write'') AND (EXISTS (SELECT 1 FROM participants p WHERE p.id = public.%I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))))', t, t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I SELECT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level(''participants'') IN (''full'', ''read_only'')) OR ((public.get_access_level(''participants'') IN (''context_read_write'', ''context_read_only'')) AND (EXISTS (SELECT 1 FROM participants p WHERE p.id = public.%I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))))', t, t, t);
    END LOOP;
END $body$;

DROP POLICY IF EXISTS "RBAC participant_goal_progress ALL (Full/Context)" ON public.participant_goal_progress;
CREATE POLICY "RBAC participant_goal_progress ALL (Full/Context)" ON public.participant_goal_progress FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('participants') = 'full') OR ((public.get_access_level('participants') = 'context_read_write') AND (EXISTS (SELECT 1 FROM participant_goals pg JOIN participants p ON p.id = pg.participant_id WHERE pg.id = goal_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))));
DROP POLICY IF EXISTS "RBAC participant_goal_progress SELECT" ON public.participant_goal_progress;
CREATE POLICY "RBAC participant_goal_progress SELECT" ON public.participant_goal_progress FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level('participants') IN ('full', 'read_only')) OR ((public.get_access_level('participants') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM participant_goals pg JOIN participants p ON p.id = pg.participant_id WHERE pg.id = goal_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))));

DROP POLICY IF EXISTS "RBAC Participant Documents ALL" ON public.participant_documents;
CREATE POLICY "RBAC Participant Documents ALL" ON public.participant_documents FOR ALL TO authenticated USING (public.is_admin() OR public.get_access_level('participants') = 'full' OR (public.get_access_level('participants') = 'context_read_write' AND EXISTS (SELECT 1 FROM participants p WHERE p.id = participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id))));
DROP POLICY IF EXISTS "RBAC Participant Documents SELECT" ON public.participant_documents;
CREATE POLICY "RBAC Participant Documents SELECT" ON public.participant_documents FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('participants') IN ('full', 'read_only') OR (public.get_access_level('participants') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM participants p WHERE p.id = participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id))));

-- Employees & HR
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff FOR SELECT TO authenticated USING (public.is_admin() OR (auth_user_id = auth.uid()) OR (public.get_access_level('employees') IN ('full', 'read_only')) OR ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))));

DROP POLICY IF EXISTS "RBAC Staff Compliance ALL (Admin/Full/Context)" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance ALL (Admin/Full/Context)" ON public.staff_compliance FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR ((public.get_access_level('employees') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));
DROP POLICY IF EXISTS "RBAC Staff Compliance SELECT" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance SELECT" ON public.staff_compliance FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()));

DROP POLICY IF EXISTS "RBAC Staff Documents ALL" ON public.staff_documents;
CREATE POLICY "RBAC Staff Documents ALL" ON public.staff_documents FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR (staff_id = public.get_my_staff_id()));
DROP POLICY IF EXISTS "RBAC Staff Documents SELECT" ON public.staff_documents;
CREATE POLICY "RBAC Staff Documents SELECT" ON public.staff_documents FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.is_staff_managed_by(staff_id, public.get_my_staff_id()) OR public.do_staff_share_house(public.get_my_staff_id(), staff_id))));

DROP POLICY IF EXISTS "RBAC Staff Training ALL" ON public.staff_training;
CREATE POLICY "RBAC Staff Training ALL" ON public.staff_training FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR ((public.get_access_level('employees') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));
DROP POLICY IF EXISTS "RBAC Staff Training SELECT" ON public.staff_training;
CREATE POLICY "RBAC Staff Training SELECT" ON public.staff_training FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()));

DROP POLICY IF EXISTS "RBAC House Staff Assignments ALL (Admin/Full/Context)" ON public.house_staff_assignments;
CREATE POLICY "RBAC House Staff Assignments ALL (Admin/Full/Context)" ON public.house_staff_assignments FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR ((public.get_access_level('employees') = 'context_read_write') AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));
DROP POLICY IF EXISTS "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments;
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

-- Shifts & Roster
DROP POLICY IF EXISTS "RBAC Shifts ALL" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts ALL" ON public.staff_shifts FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('roster_board') = 'full') OR ((public.get_access_level('roster_board') = 'context_read_write') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_shifts.staff_id AND s.auth_user_id = auth.uid())) OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

DROP POLICY IF EXISTS "RBAC Shift Participants ALL" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants ALL" ON public.shift_participants FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('roster_board') = 'full') OR (EXISTS (SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND (public.get_access_level('roster_board') = 'context_read_write') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id))));
DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND (ss.staff_id = public.get_my_staff_id() OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id) OR public.is_staff_managed_by(ss.staff_id, public.get_my_staff_id())))))));

DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND (ss.staff_id = public.get_my_staff_id() OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id) OR public.is_staff_managed_by(ss.staff_id, public.get_my_staff_id())))))));

-- Timesheets & Leave
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated USING (public.is_admin() OR (staff_id = public.get_my_staff_id()) OR (public.get_access_level('timesheets') IN ('full', 'read_only')) OR ((public.get_access_level('timesheets') IN ('context_read_write', 'context_read_only')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets FOR UPDATE TO authenticated USING (public.is_admin() OR ((staff_id = public.get_my_staff_id()) AND (status = 'pending')) OR (public.get_access_level('timesheets') = 'full') OR ((public.get_access_level('timesheets') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND (staff_id <> public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Leave INSERT" ON public.leave_requests;
CREATE POLICY "RBAC Leave INSERT" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR ((public.get_access_level('leave_requests') IN ('full', 'context_read_write')) AND (staff_id = public.get_my_staff_id())));
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_admin() OR (EXISTS (SELECT 1 FROM staff s WHERE s.id = leave_requests.staff_id AND s.auth_user_id = auth.uid())) OR (public.get_access_level('leave_requests') IN ('full', 'read_only')) OR ((public.get_access_level('leave_requests') IN ('context_read_write', 'context_read_only')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));
DROP POLICY IF EXISTS "RBAC Leave UPDATE" ON public.leave_requests;
CREATE POLICY "RBAC Leave UPDATE" ON public.leave_requests FOR UPDATE TO authenticated USING (public.is_admin() OR ((staff_id = public.get_my_staff_id()) AND (status = 'pending')) OR ((public.get_access_level('leave_requests') IN ('full', 'context_read_write')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND (staff_id <> public.get_my_staff_id())));

-- Shift Notes
DROP POLICY IF EXISTS "RBAC Shift Notes ALL" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes ALL" ON public.shift_notes FOR ALL TO authenticated USING (public.is_admin() OR (public.get_access_level('shift_notes') = 'full') OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('shift_notes') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes FOR SELECT TO authenticated USING (public.is_admin() OR (public.get_access_level('shift_notes') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('shift_notes') IN ('context_read_write', 'context_read_only')) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

-- Activity Log
DROP POLICY IF EXISTS "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log;
CREATE POLICY "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log FOR SELECT TO authenticated USING (public.is_admin() OR public.get_access_level('activity_log') = 'full');

-- 7. FORCE METADATA REBUILD
DO $body$ 
DECLARE r RECORD;
BEGIN 
  FOR r IN SELECT id FROM public.staff LOOP 
    PERFORM public.sync_staff_role_to_metadata_for_staff(r.id); 
  END LOOP; 
END $body$;

COMMIT;
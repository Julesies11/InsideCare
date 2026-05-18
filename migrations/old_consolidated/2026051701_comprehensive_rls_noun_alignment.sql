-- ========================================================================================
-- COMPREHENSIVE RLS POLICY NOUN ALIGNMENT (FIXED)
-- Date: 2026-05-18
-- ========================================================================================

BEGIN;

-- 1. DROP REMAINING LEGACY COLUMNS FROM ROLE_PERMISSIONS (Idempotent)
DO $$
BEGIN
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
    DROP COLUMN IF EXISTS leave_requests;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. MASTER LISTS & DROPDOWNS (Alignment: manage_master_lists -> master_lists)
DO $$
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
END $$;

-- 3. HOUSES & FACILITIES
DROP POLICY IF EXISTS "RBAC Houses ALL (Admin/Full)" ON public.houses;
CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') = 'full');

DROP POLICY IF EXISTS "RBAC Houses SELECT" ON public.houses;
CREATE POLICY "RBAC Houses SELECT" ON public.houses FOR SELECT TO authenticated
USING (
    public.is_admin() OR 
    public.get_access_level('houses') IN ('full', 'read_only') OR 
    (public.get_access_level('houses') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), id))
);

DROP POLICY IF EXISTS "RBAC House Comms ALL" ON public.house_comms;
CREATE POLICY "RBAC House Comms ALL" ON public.house_comms FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));

DROP POLICY IF EXISTS "RBAC House Comms SELECT" ON public.house_comms;
CREATE POLICY "RBAC House Comms SELECT" ON public.house_comms FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id));

DROP POLICY IF EXISTS "RBAC House Files ALL" ON public.house_files;
CREATE POLICY "RBAC House Files ALL" ON public.house_files FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') = 'full');

DROP POLICY IF EXISTS "RBAC House Files SELECT" ON public.house_files;
CREATE POLICY "RBAC House Files SELECT" ON public.house_files FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id));

DROP POLICY IF EXISTS "RBAC House Resources SELECT" ON public.house_resources;
CREATE POLICY "RBAC House Resources SELECT" ON public.house_resources FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id));

-- 4. CALENDAR
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;
CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), id)));

DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), id));

DROP POLICY IF EXISTS "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments;
CREATE POLICY "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR (EXISTS (SELECT 1 FROM house_calendar_events hce WHERE hce.id = event_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id))));

DROP POLICY IF EXISTS "RBAC Calendar Event Participants ALL" ON public.house_calendar_event_participants;
CREATE POLICY "RBAC Calendar Event Participants ALL" ON public.house_calendar_event_participants FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id)));

DROP POLICY IF EXISTS "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants;
CREATE POLICY "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id));

DROP POLICY IF EXISTS "RBAC Calendar Event Staff ALL" ON public.house_calendar_event_staff;
CREATE POLICY "RBAC Calendar Event Staff ALL" ON public.house_calendar_event_staff FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') = 'full' OR (public.get_access_level('houses') = 'context_read_write' AND public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id)));

DROP POLICY IF EXISTS "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff;
CREATE POLICY "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('houses') IN ('full', 'read_only') OR staff_id = public.get_my_staff_id() OR public.is_staff_linked_to_calendar_event(public.get_my_staff_id(), event_id));

-- 5. CHECKLISTS & ROUTINES
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists FOR SELECT TO authenticated
USING (public.is_admin() OR is_global = true OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));

DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;
CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items FOR ALL TO authenticated
USING (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklists hc WHERE hc.id = checklist_id AND (public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hc.house_id))))));

DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items FOR SELECT TO authenticated
USING (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklists hc WHERE hc.id = checklist_id AND (hc.is_global = true OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hc.house_id))))));

DROP POLICY IF EXISTS "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments;
CREATE POLICY "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.get_access_level('shift_routines') = 'full' OR (public.get_access_level('shift_routines') = 'context_read_write' AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id))))));

DROP POLICY IF EXISTS "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments;
CREATE POLICY "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments FOR SELECT TO authenticated
USING (public.is_admin() OR (EXISTS (SELECT 1 FROM house_checklist_submissions hcs WHERE hcs.id = submission_id AND (public.get_access_level('house_checklists') IN ('full', 'read_only') OR public.get_access_level('shift_routines') IN ('full', 'read_only') OR ((public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id))))));

-- 6. FORMS
DROP POLICY IF EXISTS "RBAC house_forms ALL (Admin/Full/Context)" ON public.house_forms;
CREATE POLICY "RBAC house_forms ALL (Admin/Full/Context)" ON public.house_forms FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM house_staff_assignments hsa WHERE hsa.house_id = public.house_forms.house_id AND hsa.staff_id = public.get_my_staff_id() AND (hsa.end_date IS NULL OR hsa.end_date > now()))));

DROP POLICY IF EXISTS "RBAC house_forms SELECT" ON public.house_forms;
CREATE POLICY "RBAC house_forms SELECT" ON public.house_forms FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM house_staff_assignments hsa WHERE hsa.house_id = public.house_forms.house_id AND hsa.staff_id = public.get_my_staff_id() AND (hsa.end_date IS NULL OR hsa.end_date > now()))));

-- sub-tables: house_form_assignments, house_form_submissions
DROP POLICY IF EXISTS "RBAC house_form_assignments ALL (Admin/Full/Context)" ON public.house_form_assignments;
CREATE POLICY "RBAC house_form_assignments ALL (Admin/Full/Context)" ON public.house_form_assignments FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));

DROP POLICY IF EXISTS "RBAC house_form_assignments SELECT" ON public.house_form_assignments;
CREATE POLICY "RBAC house_form_assignments SELECT" ON public.house_form_assignments FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));

DROP POLICY IF EXISTS "RBAC house_form_submissions ALL (Admin/Full/Context)" ON public.house_form_submissions;
CREATE POLICY "RBAC house_form_submissions ALL (Admin/Full/Context)" ON public.house_form_submissions FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('house_checklists') = 'full' OR (public.get_access_level('house_checklists') = 'context_read_write' AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));

DROP POLICY IF EXISTS "RBAC house_form_submissions SELECT" ON public.house_form_submissions;
CREATE POLICY "RBAC house_form_submissions SELECT" ON public.house_form_submissions FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('house_checklists') IN ('full', 'read_only') OR (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hf.house_id))));

-- 7. PARTICIPANTS
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants FOR SELECT TO authenticated
USING (
    public.is_admin() OR 
    public.get_access_level('participants') IN ('full', 'read_only') OR 
    (public.get_access_level('participants') IN ('context_read_write', 'context_read_only') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)) OR 
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR 
    (EXISTS (SELECT 1 FROM staff_shifts ss WHERE ss.house_id = participants.house_id AND ss.staff_id = public.get_my_staff_id()))
);

-- participant sub-tables with direct participant_id
DO $$
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
            USING (public.is_admin() OR (public.get_access_level(''participants'') = ''full'') OR ((public.get_access_level(''participants'') = ''context_read_write'') AND (EXISTS (SELECT 1 FROM participants p WHERE p.id = %I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))))', t, t, t);
            
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I SELECT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated 
            USING (public.is_admin() OR (public.get_access_level(''participants'') IN (''full'', ''read_only'')) OR ((public.get_access_level(''participants'') IN (''context_read_write'', ''context_read_only'')) AND (EXISTS (SELECT 1 FROM participants p WHERE p.id = %I.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))))', t, t, t);
    END LOOP;
END $$;

-- Table: participant_goal_progress (Joins via goal_id)
DROP POLICY IF EXISTS "RBAC participant_goal_progress ALL (Full/Context)" ON public.participant_goal_progress;
CREATE POLICY "RBAC participant_goal_progress ALL (Full/Context)" ON public.participant_goal_progress FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('participants') = 'full') OR ((public.get_access_level('participants') = 'context_read_write') AND (EXISTS (SELECT 1 FROM participant_goals pg JOIN participants p ON p.id = pg.participant_id WHERE pg.id = goal_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))));

DROP POLICY IF EXISTS "RBAC participant_goal_progress SELECT" ON public.participant_goal_progress;
CREATE POLICY "RBAC participant_goal_progress SELECT" ON public.participant_goal_progress FOR SELECT TO authenticated
USING (public.is_admin() OR (public.get_access_level('participants') IN ('full', 'read_only')) OR ((public.get_access_level('participants') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM participant_goals pg JOIN participants p ON p.id = pg.participant_id WHERE pg.id = goal_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)))));

-- participant_documents
DROP POLICY IF EXISTS "RBAC Participant Documents ALL" ON public.participant_documents;
CREATE POLICY "RBAC Participant Documents ALL" ON public.participant_documents FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('participants') = 'full' OR (public.get_access_level('participants') = 'context_read_write' AND EXISTS (SELECT 1 FROM participants p WHERE p.id = participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id))));

DROP POLICY IF EXISTS "RBAC Participant Documents SELECT" ON public.participant_documents;
CREATE POLICY "RBAC Participant Documents SELECT" ON public.participant_documents FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_access_level('participants') IN ('full', 'read_only') OR (public.get_access_level('participants') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM participants p WHERE p.id = participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id))));

-- 8. STAFF & EMPLOYEES
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff FOR SELECT TO authenticated
USING (
    public.is_admin() OR 
    (auth_user_id = auth.uid()) OR 
    (public.get_access_level('employees') IN ('full', 'read_only')) OR 
    ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id())))
);

DROP POLICY IF EXISTS "RBAC Staff Compliance ALL (Admin/Full/Context)" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance ALL (Admin/Full/Context)" ON public.staff_compliance FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR ((public.get_access_level('employees') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Staff Compliance SELECT" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance SELECT" ON public.staff_compliance FOR SELECT TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()));

DROP POLICY IF EXISTS "RBAC Staff Documents ALL" ON public.staff_documents;
CREATE POLICY "RBAC Staff Documents ALL" ON public.staff_documents FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR (staff_id = public.get_my_staff_id()));

DROP POLICY IF EXISTS "RBAC Staff Documents SELECT" ON public.staff_documents;
CREATE POLICY "RBAC Staff Documents SELECT" ON public.staff_documents FOR SELECT TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.is_staff_managed_by(staff_id, public.get_my_staff_id()) OR public.do_staff_share_house(public.get_my_staff_id(), staff_id))));

DROP POLICY IF EXISTS "RBAC Staff Training ALL" ON public.staff_training;
CREATE POLICY "RBAC Staff Training ALL" ON public.staff_training FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR ((public.get_access_level('employees') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Staff Training SELECT" ON public.staff_training;
CREATE POLICY "RBAC Staff Training SELECT" ON public.staff_training FOR SELECT TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()));

DROP POLICY IF EXISTS "RBAC House Staff Assignments ALL (Admin/Full/Context)" ON public.house_staff_assignments;
CREATE POLICY "RBAC House Staff Assignments ALL (Admin/Full/Context)" ON public.house_staff_assignments FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') = 'full') OR ((public.get_access_level('employees') = 'context_read_write') AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

DROP POLICY IF EXISTS "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments;
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments FOR SELECT TO authenticated
USING (public.is_admin() OR (public.get_access_level('employees') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('employees') IN ('context_read_write', 'context_read_only')) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

-- 9. ROSTER & SHIFTS
DROP POLICY IF EXISTS "RBAC Shifts ALL" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts ALL" ON public.staff_shifts FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('roster_board') = 'full') OR ((public.get_access_level('roster_board') = 'context_read_write') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)));

DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated
USING (public.is_admin() OR (EXISTS (SELECT 1 FROM staff s WHERE s.id = staff_shifts.staff_id AND s.auth_user_id = auth.uid())) OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

DROP POLICY IF EXISTS "RBAC Shift Participants ALL" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants ALL" ON public.shift_participants FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('roster_board') = 'full') OR (EXISTS (SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND (public.get_access_level('roster_board') = 'context_read_write') AND public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id))));

DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants FOR SELECT TO authenticated
USING (public.is_admin() OR (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND (ss.staff_id = public.get_my_staff_id() OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id) OR public.is_staff_managed_by(ss.staff_id, public.get_my_staff_id())))))));

DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists FOR SELECT TO authenticated
USING (public.is_admin() OR (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND (ss.staff_id = public.get_my_staff_id() OR (public.get_access_level('roster_board') IN ('full', 'read_only')) OR (public.get_access_level('my_roster') IN ('full', 'read_only')) OR (((public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only')) OR (public.get_access_level('my_roster') IN ('context_read_write', 'context_read_only'))) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id) OR public.is_staff_managed_by(ss.staff_id, public.get_my_staff_id())))))));

-- 10. TIMESHEETS & LEAVE
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated
USING (public.is_admin() OR (staff_id = public.get_my_staff_id()) OR (public.get_access_level('timesheets') IN ('full', 'read_only')) OR ((public.get_access_level('timesheets') IN ('context_read_write', 'context_read_only')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets FOR UPDATE TO authenticated
USING (public.is_admin() OR ((staff_id = public.get_my_staff_id()) AND (status = 'pending')) OR (public.get_access_level('timesheets') = 'full') OR ((public.get_access_level('timesheets') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND (staff_id <> public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Leave INSERT" ON public.leave_requests;
CREATE POLICY "RBAC Leave INSERT" ON public.leave_requests FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR ((public.get_access_level('leave_requests') IN ('full', 'context_read_write')) AND (staff_id = public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests FOR SELECT TO authenticated
USING (public.is_admin() OR (EXISTS (SELECT 1 FROM staff s WHERE s.id = leave_requests.staff_id AND s.auth_user_id = auth.uid())) OR (public.get_access_level('leave_requests') IN ('full', 'read_only')) OR ((public.get_access_level('leave_requests') IN ('context_read_write', 'context_read_only')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Leave UPDATE" ON public.leave_requests;
CREATE POLICY "RBAC Leave UPDATE" ON public.leave_requests FOR UPDATE TO authenticated
USING (public.is_admin() OR ((staff_id = public.get_my_staff_id()) AND (status = 'pending')) OR ((public.get_access_level('leave_requests') IN ('full', 'context_read_write')) AND public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND (staff_id <> public.get_my_staff_id())));

-- 11. SHIFT NOTES
DROP POLICY IF EXISTS "RBAC Shift Notes ALL" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes ALL" ON public.shift_notes FOR ALL TO authenticated
USING (public.is_admin() OR (public.get_access_level('shift_notes') = 'full') OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('shift_notes') = 'context_read_write') AND public.is_staff_managed_by(staff_id, public.get_my_staff_id())));

DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes FOR SELECT TO authenticated
USING (public.is_admin() OR (public.get_access_level('shift_notes') IN ('full', 'read_only')) OR (staff_id = public.get_my_staff_id()) OR ((public.get_access_level('shift_notes') IN ('context_read_write', 'context_read_only')) AND (public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR public.is_staff_managed_by(staff_id, public.get_my_staff_id()))));

-- 12. FORCE SYNC ALL STAFF METADATA ONE LAST TIME
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN SELECT id FROM public.staff LOOP 
    PERFORM public.sync_staff_role_to_metadata_for_staff(r.id); 
  END LOOP; 
END $$;

COMMIT;

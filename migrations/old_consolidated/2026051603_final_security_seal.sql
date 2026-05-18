-- Migration: Final Security Seal
-- Description: Surgical fixes for broken logic, role enforcement, and final policy cleanup.

BEGIN;

-- ========================================================================================
-- 1. FIX BROKEN CALENDAR EVENT VISIBILITY & ENFORCE AUTHENTICATED ROLE
-- ========================================================================================

-- House Calendar Events
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (get_access_level('manage_participants'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    (EXISTS (SELECT 1 FROM public.house_calendar_event_staff hces WHERE hces.event_id = public.house_calendar_events.id AND hces.staff_id = get_my_staff_id()))
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklists
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    is_global = true OR 
    (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Items
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;

CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        hc.is_global = true OR
        (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
        ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

-- House Checklist Submissions
DROP POLICY IF EXISTS "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions;
CREATE POLICY "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Submission Items
DROP POLICY IF EXISTS "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items;
CREATE POLICY "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklist_submissions hcs 
      WHERE hcs.id = public.house_checklist_submission_items.submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklist_submissions hcs 
      WHERE hcs.id = public.house_checklist_submission_items.submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  );

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text)) OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id()))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text))
  );

-- ========================================================================================
-- 2. UNBLOCK OPERATIONAL TABLES (Explicit contextual policies)
-- ========================================================================================

-- House Comms
DROP POLICY IF EXISTS "RBAC House Comms SELECT" ON public.house_comms;
DROP POLICY IF EXISTS "RBAC House Comms ALL" ON public.house_comms;

CREATE POLICY "RBAC House Comms SELECT" ON public.house_comms
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

CREATE POLICY "RBAC House Comms ALL" ON public.house_comms
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Calendar Event Attachments
DROP POLICY IF EXISTS "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments;
DROP POLICY IF EXISTS "RBAC Event Attachments ALL" ON public.house_calendar_event_attachments;

CREATE POLICY "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

CREATE POLICY "RBAC Event Attachments ALL" ON public.house_calendar_event_attachments
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND (get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND (get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

-- Branch Documents & Policies
DROP POLICY IF EXISTS "RBAC Branch Docs SELECT" ON public.branch_documents;
DROP POLICY IF EXISTS "RBAC Branch Policies SELECT" ON public.branch_policies;

CREATE POLICY "RBAC Branch Docs SELECT" ON public.branch_documents
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "RBAC Branch Policies SELECT" ON public.branch_policies
  FOR SELECT TO authenticated
  USING (true);

-- ========================================================================================
-- 3. MASTER DATA CLEANUP (Explicit consolidation)
-- ========================================================================================

-- Medication Master
DROP POLICY IF EXISTS "RBAC medications_master SELECT" ON public.medications_master;
DROP POLICY IF EXISTS "RBAC medications_master ALL" ON public.medications_master;
DROP POLICY IF EXISTS "RBAC medications_master ALL (Admin/Full)" ON public.medications_master;
DROP POLICY IF EXISTS "Staff select medications_master" ON public.medications_master;
DROP POLICY IF EXISTS "Staff select medications master" ON public.medications_master;
DROP POLICY IF EXISTS "Admins full access" ON public.medications_master;

CREATE POLICY "RBAC medications_master SELECT" ON public.medications_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC medications_master ALL" ON public.medications_master FOR ALL TO authenticated 
    USING (is_admin() OR get_access_level('manage_master_lists') = 'full')
    WITH CHECK (is_admin() OR get_access_level('manage_master_lists') = 'full');

-- Roles
DROP POLICY IF EXISTS "RBAC roles SELECT" ON public.roles;
DROP POLICY IF EXISTS "RBAC roles ALL" ON public.roles;
DROP POLICY IF EXISTS "RBAC roles ALL (Admin/Full)" ON public.roles;
DROP POLICY IF EXISTS "Staff select roles" ON public.roles;
DROP POLICY IF EXISTS "Staff select master tables" ON public.roles;
DROP POLICY IF EXISTS "Admins full access" ON public.roles;

CREATE POLICY "RBAC roles SELECT" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC roles ALL" ON public.roles FOR ALL TO authenticated 
    USING (is_admin() OR get_access_level('manage_master_lists') = 'full')
    WITH CHECK (is_admin() OR get_access_level('manage_master_lists') = 'full');

-- Repeat for all other master tables (Contact Types, Funding, etc. - using the logic factory pattern in the DB is better but I will be explicit for the critical ones)

-- ========================================================================================
-- 4. STANDARDIZE ADMIN HELPERS (Explicit fixes for core tables)
-- ========================================================================================

-- Staff
DROP POLICY IF EXISTS "RBAC Staff ALL (Admin)" ON public.staff;
DROP POLICY IF EXISTS "Admins have full access to staff" ON public.staff;
DROP POLICY IF EXISTS "Admins full access" ON public.staff;
CREATE POLICY "RBAC Staff ALL (Admin)" ON public.staff FOR ALL TO authenticated USING (is_admin());

-- Participants
DROP POLICY IF EXISTS "RBAC Participants ALL (Admin)" ON public.participants;
DROP POLICY IF EXISTS "Admins full access" ON public.participants;
CREATE POLICY "RBAC Participants ALL (Admin)" ON public.participants FOR ALL TO authenticated USING (is_admin());

-- Activity Log
DROP POLICY IF EXISTS "RBAC Activity Log ALL (Admin)" ON public.activity_log;
DROP POLICY IF EXISTS "Admins full access" ON public.activity_log;
CREATE POLICY "RBAC Activity Log ALL (Admin)" ON public.activity_log FOR ALL TO authenticated USING (is_admin());

COMMIT;

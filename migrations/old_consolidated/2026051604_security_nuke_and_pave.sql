-- Migration: Security Nuke & Pave
-- Description: Wipes all existing policies on core tables and rebuilds them to a hardened, authenticated-only standard.

BEGIN;

-- 1. Dynamic Cleanup: Drop every policy on core and master tables to ensure no duplicates or {public} leaks remain.
DO $$ 
DECLARE 
    t text;
    tables_to_clean text[] := ARRAY[
        'house_calendar_events', 'house_checklists', 'house_checklist_items', 
        'house_checklist_submissions', 'house_checklist_submission_items', 
        'timesheets', 'house_comms', 'house_calendar_event_attachments',
        'medications_master', 'roles', 'staff', 'participants', 'activity_log',
        'branches', 'departments', 'leave_types', 'house_calendar_event_types_master',
        'branch_documents', 'branch_policies'
    ];
    p record;
BEGIN
    FOREACH t IN ARRAY tables_to_clean LOOP
        FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- ========================================================================================
-- 2. REBUILD CORE OPERATIONAL POLICIES (Authenticated Role + Hardened Logic)
-- ========================================================================================

-- House Calendar Events
CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
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
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    is_global = true OR 
    (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Items
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

-- Timesheets
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
-- 3. UNBLOCK OPERATIONAL TABLES (Explicit Contextual Policies)
-- ========================================================================================

-- House Comms
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

-- Branch Documents & Policies
CREATE POLICY "RBAC Branch Docs SELECT" ON public.branch_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Branch Policies SELECT" ON public.branch_policies FOR SELECT TO authenticated USING (true);

-- ========================================================================================
-- 4. MASTER DATA CLEANUP (Standardized SELECT + Admin ALL)
-- ========================================================================================

DO $$
DECLARE
    t text;
    v_master_tables text[] := ARRAY[
        'branches', 'departments', 'roles', 'medications_master', 'leave_types', 
        'house_calendar_event_types_master'
    ];
BEGIN
    FOREACH t IN ARRAY v_master_tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')
            WITH CHECK (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')', t, t);
    END LOOP;
END $$;

-- ========================================================================================
-- 5. STANDARDIZE ADMIN HELPERS (Core Identity Tables)
-- ========================================================================================

CREATE POLICY "RBAC Staff ALL (Admin)" ON public.staff FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "RBAC Participants ALL (Admin)" ON public.participants FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "RBAC Activity Log ALL (Admin)" ON public.activity_log FOR ALL TO authenticated USING (is_admin());

COMMIT;

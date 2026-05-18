-- Migration: Security Hardening & RBAC Cleanup
-- Description: Standardizes roles, fixes logic errors, unblocks operational tables, and cleans up redundancy.

BEGIN;

-- ========================================================================================
-- 1. STANDARDIZE ROLES & FIX LOGIC ERRORS (Move from public to authenticated)
-- ========================================================================================

-- House Calendar Events
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;

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

-- House Checklist Items
DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;

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

-- Timesheets UPDATE
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
-- 2. UNBLOCK OPERATIONAL TABLES (New contextual policies)
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
CREATE POLICY "RBAC Branch Docs SELECT" ON public.branch_documents
  FOR SELECT TO authenticated
  USING (true); -- Global visibility for staff, protected by RLS (authenticated only)

CREATE POLICY "RBAC Branch Policies SELECT" ON public.branch_policies
  FOR SELECT TO authenticated
  USING (true);

-- ========================================================================================
-- 3. MASTER DATA CLEANUP (Consolidate redundant policies)
-- ========================================================================================

DO $$
DECLARE
    t text;
    v_master_tables text[] := ARRAY[
        'contact_types_master', 'funding_sources_master', 'employment_types_master',
        'house_types_master', 'funding_types_master', 'branches', 'departments',
        'roles', 'medications_master', 'leave_types', 'house_calendar_event_types_master',
        'checklist_master', 'checklist_item_master'
    ];
    p record;
BEGIN
    FOREACH t IN ARRAY v_master_tables LOOP
        -- Drop all existing policies for this table to start fresh
        FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
        END LOOP;
        
        -- 1. SELECT for all authenticated
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        
        -- 2. ALL for Admins and Master List Managers
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')
            WITH CHECK (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')', t, t);
    END LOOP;
END $$;

-- ========================================================================================
-- 4. LEGACY ADMIN CHECK CLEANUP (Standardize on is_admin())
-- ========================================================================================

DO $$
DECLARE
    r record;
    v_new_qual text;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
        FROM pg_policies 
        WHERE qual LIKE '%auth.jwt() -> ''user_metadata''%is_admin%'
           OR with_check LIKE '%auth.jwt() -> ''user_metadata''%is_admin%'
    LOOP
        v_new_qual := replace(replace(r.qual, '((((auth.jwt() -> ''user_metadata''::text) ->> ''is_admin''::text))::boolean = true)', 'is_admin()'), '(((auth.jwt() -> ''user_metadata''::text) ->> ''is_admin''::text))::boolean = true', 'is_admin()');
        
        EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        
        IF r.with_check IS NOT NULL THEN
            EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s) WITH CHECK (%s)', 
                r.policyname, r.schemaname, r.tablename, r.cmd, array_to_string(r.roles, ','), v_new_qual, replace(r.with_check, '((((auth.jwt() -> ''user_metadata''::text) ->> ''is_admin''::text))::boolean = true)', 'is_admin()'));
        ELSE
            EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s)', 
                r.policyname, r.schemaname, r.tablename, r.cmd, array_to_string(r.roles, ','), v_new_qual);
        END IF;
    END LOOP;
END $$;

COMMIT;

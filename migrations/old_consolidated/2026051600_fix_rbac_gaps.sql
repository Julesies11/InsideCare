-- Migration: Fix RBAC Gaps
-- Description: Adds missing policies for events and checklist items, fixes global checklist visibility, and removes legacy status checks.

-- 1. House Calendar Events Policies
-- DROP any old or conflicting policies if they exist (though audit showed none for the parent table)
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (get_access_level('house_profiles'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR -- Shim for legacy name
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    (EXISTS (SELECT 1 FROM house_calendar_event_staff hces WHERE hces.event_id = id AND hces.staff_id = get_my_staff_id()))
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    (get_access_level('house_profiles'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    ((get_access_level('house_profiles'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    (get_access_level('house_profiles'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    ((get_access_level('house_profiles'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- 2. House Checklist Items Policies
-- Use the unified ALL policy and clean up old ones
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;

CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
  FOR SELECT
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklists hc 
      WHERE hc.id = checklist_id AND (
        hc.is_global = true OR
        (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
        ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id)) OR
        (get_access_level('house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items
  FOR ALL
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklists hc 
      WHERE hc.id = checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklists hc 
      WHERE hc.id = checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

-- 3. Fix Global House Checklists Visibility
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
  FOR SELECT
  USING (
    is_admin() OR 
    is_global = true OR -- Global flag override
    (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    (get_access_level('house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR -- Compatibility
    ((get_access_level('house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- 4. Clean up Timesheet Update Logic (Remove draft check)
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
  FOR UPDATE
  USING (
    is_admin() OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text)) OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR
    (get_access_level('timesheets_approve'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('timesheets_approve'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id()))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    (get_access_level('timesheets_approve'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('timesheets_approve'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text))
  );

-- 5. House Checklist Submissions & Items ALL Policies
-- Drop existing INSERT/UPDATE policies to clean up and avoid overlap
DROP POLICY IF EXISTS "RBAC Checklist Submissions INSERT" ON public.house_checklist_submissions;
DROP POLICY IF EXISTS "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions;

CREATE POLICY "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions
  FOR ALL
  USING (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
    ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
    ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

DROP POLICY IF EXISTS "RBAC Checklist Submission Items INSERT" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items;

CREATE POLICY "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items
  FOR ALL
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklist_submissions hcs 
      WHERE hcs.id = submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklist_submissions hcs 
      WHERE hcs.id = submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  );

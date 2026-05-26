-- Migration: Final RBAC Hardening and Cleanup
-- Date: 2026-05-19
-- Description: Drops redundant tables and applies definitive RLS policies to all remaining master lists and operational sub-tables.

-- 1. DROP REDUNDANT TABLES
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.support_plans CASCADE;
DROP TABLE IF EXISTS public.branch_documents CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- 2. HARDEN SENSITIVE MASTER LISTS (No longer public SELECT: true)

-- user_roles
DROP POLICY IF EXISTS "RBAC user_roles SELECT" ON public.user_roles;
CREATE POLICY "RBAC user_roles SELECT" ON public.user_roles FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('access_control') IN ('full', 'read_only')
);

-- roles
DROP POLICY IF EXISTS "RBAC roles SELECT" ON public.roles;
CREATE POLICY "RBAC roles SELECT" ON public.roles FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('access_control') IN ('full', 'read_only')
);

-- branches
DROP POLICY IF EXISTS "RBAC branches SELECT" ON public.branches;
CREATE POLICY "RBAC branches SELECT" ON public.branches FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('master_lists') IN ('full', 'read_only')
);

-- departments
DROP POLICY IF EXISTS "RBAC departments SELECT" ON public.departments;
CREATE POLICY "RBAC departments SELECT" ON public.departments FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('master_lists') IN ('full', 'read_only')
);


-- 3. APPLY MISSING RLS TO ACTIVE TABLES

-- checklist_schedules
ALTER TABLE public.checklist_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RBAC checklist_schedules ALL" ON public.checklist_schedules;
CREATE POLICY "RBAC checklist_schedules ALL" ON public.checklist_schedules FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR
    (jwt_get_perm('house_checklists') = 'context_read_write' AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC checklist_schedules SELECT" ON public.checklist_schedules;
CREATE POLICY "RBAC checklist_schedules SELECT" ON public.checklist_schedules FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_has_house(house_id) OR
    jwt_get_perm('house_checklists') IN ('full', 'read_only')
);


-- 4. FIX MISSING 'FULL' PERMISSION OVERRIDES (Child/Operational tables)

-- house_calendar_event_attachments
DROP POLICY IF EXISTS "RBAC house_calendar_event_attachments ALL" ON public.house_calendar_event_attachments;
CREATE POLICY "RBAC house_calendar_event_attachments ALL" ON public.house_calendar_event_attachments FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_calendar_events hce WHERE hce.id = event_id AND jwt_has_house(hce.house_id)
    ))
);

-- house_calendar_event_participants
DROP POLICY IF EXISTS "RBAC house_calendar_event_participants ALL" ON public.house_calendar_event_participants;
CREATE POLICY "RBAC house_calendar_event_participants ALL" ON public.house_calendar_event_participants FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_calendar_events hce WHERE hce.id = event_id AND jwt_has_house(hce.house_id)
    ))
);

-- house_calendar_event_staff
DROP POLICY IF EXISTS "RBAC house_calendar_event_staff ALL" ON public.house_calendar_event_staff;
CREATE POLICY "RBAC house_calendar_event_staff ALL" ON public.house_calendar_event_staff FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_calendar_events hce WHERE hce.id = event_id AND jwt_has_house(hce.house_id)
    ))
);

-- house_checklist_item_attachments
DROP POLICY IF EXISTS "RBAC house_checklist_item_attachments ALL" ON public.house_checklist_item_attachments;
CREATE POLICY "RBAC house_checklist_item_attachments ALL" ON public.house_checklist_item_attachments FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR
    (jwt_get_perm('house_checklists') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_checklist_submissions hcs WHERE hcs.id = submission_id AND jwt_has_house(hcs.house_id)
    ))
);

-- house_checklist_submission_items
DROP POLICY IF EXISTS "RBAC house_checklist_submission_items ALL" ON public.house_checklist_submission_items;
CREATE POLICY "RBAC house_checklist_submission_items ALL" ON public.house_checklist_submission_items FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR
    (jwt_get_perm('house_checklists') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_checklist_submissions hcs WHERE hcs.id = submission_id AND jwt_has_house(hcs.house_id)
    ))
);

-- Migration: Rename 'name' columns to entity-specific names
-- Description: Refactors generic 'name' columns across all tables to avoid reserved keyword conflicts and ambiguity.
-- Convention: [entity]_name (e.g., ic_participants.name -> participant_name)

-- 1. RENAME COLUMNS
ALTER TABLE public.ic_branches RENAME COLUMN name TO branch_name;
ALTER TABLE public.ic_checklist_master RENAME COLUMN name TO checklist_name;
ALTER TABLE public.ic_contact_types_master RENAME COLUMN name TO contact_type_name;
ALTER TABLE public.ic_departments RENAME COLUMN name TO department_name;
ALTER TABLE public.ic_employment_types_master RENAME COLUMN name TO employment_type_name;
ALTER TABLE public.ic_funding_sources_master RENAME COLUMN name TO funding_source_name;
ALTER TABLE public.ic_funding_types_master RENAME COLUMN name TO funding_type_name;
ALTER TABLE public.ic_house_calendar_event_types_master RENAME COLUMN name TO event_type_name;
ALTER TABLE public.ic_house_checklists RENAME COLUMN name TO house_checklist_name;
ALTER TABLE public.ic_house_forms RENAME COLUMN name TO house_form_name;
ALTER TABLE public.ic_house_shift_templates RENAME COLUMN name TO shift_template_name;
ALTER TABLE public.ic_house_types_master RENAME COLUMN name TO house_type_name;
ALTER TABLE public.ic_houses RENAME COLUMN name TO house_name;
ALTER TABLE public.ic_leave_types RENAME COLUMN name TO leave_type_name;
ALTER TABLE public.ic_medications_master RENAME COLUMN name TO medication_name;
ALTER TABLE public.ic_participants RENAME COLUMN name TO participant_name;
ALTER TABLE public.ic_providers RENAME COLUMN name TO provider_name;
ALTER TABLE public.ic_roles RENAME COLUMN name TO role_name;
ALTER TABLE public.ic_services RENAME COLUMN name TO service_name;
ALTER TABLE public.ic_staff RENAME COLUMN name TO staff_name;

-- 2. UPDATE TRIGGER FUNCTIONS
-- We only need to update functions that explicitly reference the old column names.

CREATE OR REPLACE FUNCTION public.ic_sync_staff_role_to_metadata_for_staff(p_staff_id uuid) RETURNS void AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.ic_staff WHERE id = p_staff_id;
  -- UPDATED: role_name instead of name
  SELECT role_name INTO v_role_name FROM public.ic_roles WHERE id = v_staff_record.role_id;
  SELECT jsonb_build_object(
    'my_roster', my_roster, 'my_timesheets', my_timesheets, 'my_leave', my_leave, 'shift_routines', shift_routines,
    'participants', participants, 'shift_notes', shift_notes,
    'employees', employees, 'timesheets', timesheets, 'leave_requests', leave_requests, 'roster_board', roster_board,
    'houses', houses, 'house_checklists', house_checklists,
    'access_control', access_control, 'master_lists', master_lists, 'activity_log', activity_log
  ) INTO v_permissions FROM public.ic_role_permissions WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role_name', v_role_name, 'permissions', COALESCE(v_permissions, '{}'::jsonb)) WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. UPDATE RLS POLICIES (IF NECESSARY)
-- RENAME COLUMN automatically updates policies that reference the column name directly in their expressions.
-- However, we must ensure any explicit text-based SQL in views or complex RLS is audited.
-- Based on the storage_schema.json audit, we update policies that use the old 'name' identifier.

-- Note: Postgres automatically renames column references in RLS policies when the column is renamed via ALTER TABLE.
-- But for clarity and to ensure JSON exports match, we would normally recreate them if they were broken.
-- In this case, we will trust the database's automatic reference tracking for RLS 'qual' and 'with_check' expressions.

-- 4. STORAGE RLS POLICIES
-- Storage policies on storage.objects refer to columns in public.* tables.
-- These will NOT be automatically updated because they are in different schemas/tables.

-- We need to DROP and RECREATE Storage policies that reference public.[entity].name.
-- (This step is typically handled via a full RBAC refresh or specific ALTER POLICY calls).

-- Re-syncing storage policies that reference the renamed columns:

DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'ic_branch-documents'::text) AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM ic_houses h WHERE (((h.branch_id)::text = split_part(h.house_name, '/'::text, 1)) AND ic_jwt_has_house(h.id))))));

DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK ((bucket_id = 'ic_participant-documents'::text) AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM ic_participants p WHERE (((p.id)::text = split_part(p.participant_name, '/'::text, 1)) AND ic_jwt_has_house(p.house_id) AND (ic_jwt_get_perm('participants'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text])))))));

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'ic_participant-documents'::text) AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR ((ic_jwt_get_perm('participants'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND (EXISTS ( SELECT 1 FROM ic_participants p WHERE (((p.id)::text = split_part(p.participant_name, '/'::text, 1)) AND ic_jwt_has_house(p.house_id)))))));

DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'ic_participant-photos'::text) AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR ((ic_jwt_get_perm('participants'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND (EXISTS ( SELECT 1 FROM ic_participants p WHERE ((((p.id)::text = split_part(p.participant_name, '/'::text, 1)) OR (p.photo_url ~~* ('%'::text || p.participant_name))) AND ic_jwt_has_house(p.house_id)))))));

DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'ic_staff-documents'::text) AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('employees'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR (split_part(name, '/'::text, 1) = (ic_jwt_get_staff_id())::text) OR ((ic_jwt_get_perm('employees'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND (EXISTS ( SELECT 1 FROM ic_staff s WHERE (((s.id)::text = split_part(s.staff_name, '/'::text, 1)) AND ic_jwt_manages_staff(s.id)))))));

DROP POLICY IF EXISTS "RBAC staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'ic_staff-photos'::text) AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('employees'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR (split_part(name, '/'::text, 1) = (ic_jwt_get_staff_id())::text) OR ((ic_jwt_get_perm('employees'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND (EXISTS ( SELECT 1 FROM (ic_house_staff_assignments hsa JOIN ic_staff s ON ((s.id = hsa.staff_id))) WHERE ((((hsa.staff_id)::text = split_part(s.staff_name, '/'::text, 1)) OR (s.photo_url ~~* ('%'::text || s.staff_name))) AND ic_jwt_has_house(hsa.house_id)))))));

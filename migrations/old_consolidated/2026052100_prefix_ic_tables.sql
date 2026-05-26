BEGIN;

-- ==========================================
-- 1. RENAME ENUMS
-- ==========================================
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_enum') THEN
        ALTER TYPE public.access_level_enum RENAME TO ic_access_level_enum;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_period_enum') THEN
        ALTER TYPE public.shift_period_enum RENAME TO ic_shift_period_enum;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
        ALTER TYPE public.status_enum RENAME TO ic_status_enum;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_type_enum') THEN
        ALTER TYPE public.checklist_type_enum RENAME TO ic_checklist_type_enum;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_enum_new') THEN
        ALTER TYPE public.access_level_enum_new RENAME TO ic_access_level_enum_new;
    END IF;
END $$;

-- ==========================================
-- 2. RENAME TABLES
-- ==========================================
DO $$
DECLARE
    tab RECORD;
BEGIN
    FOR tab IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'activity_log', 'branch_policies', 'branches', 'checklist_item_master', 'checklist_master',
            'checklist_schedules', 'contact_types_master', 'departments', 'employment_types_master',
            'error_logs', 'funding_sources_master', 'funding_types_master', 'house_calendar_event_attachments',
            'house_calendar_event_participants', 'house_calendar_event_staff', 'house_calendar_event_types_master',
            'house_calendar_events', 'house_checklist_item_attachments', 'house_checklist_items',
            'house_checklist_submission_items', 'house_checklist_submissions', 'house_checklists',
            'house_comms', 'house_files', 'house_form_assignments', 'house_form_submissions',
            'house_forms', 'house_resources', 'house_shift_templates', 'house_staff_assignments',
            'house_types_master', 'houses', 'leave_requests', 'leave_types', 'medications_master',
            'notifications', 'participant_contacts', 'participant_documents', 'participant_forms',
            'participant_funding', 'participant_goal_progress', 'participant_goals', 'participant_hygiene_routines',
            'participant_medications', 'participant_notes', 'participant_restrictive_practices', 'participants',
            'permission_mappings', 'positions', 'provider_participants', 'providers', 'role_permissions',
            'roles', 'service_participants', 'service_staff', 'services', 'shift_assigned_checklists',
            'shift_notes', 'shift_participants', 'shift_template_checklists', 'shift_template_default_checklists',
            'staff', 'staff_compliance', 'staff_documents', 'staff_shifts', 'staff_training', 'timesheets', 'user_roles'
        )
    )
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME TO %I', tab.tablename, 'ic_' || tab.tablename);
    END LOOP;
END $$;

-- ==========================================
-- 3. RENAME FUNCTIONS (SAFE DO BLOCK)
-- ==========================================
DO $$
DECLARE
    func RECORD;
BEGIN
    FOR func IN (
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc n
        JOIN pg_namespace ns ON n.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
        AND proname IN (
            'handle_new_role_permissions', 'handle_role_deletion_sync', 'jwt_get_perm', 
            'jwt_get_staff_id', 'jwt_has_house', 'jwt_is_admin', 'jwt_manages_staff', 
            'propagate_role_permission_changes', 'sync_staff_role_to_metadata', 
            'sync_staff_role_to_metadata_for_staff', 'update_compliance_status',
            'update_house_checklist_items_updated_at', 'update_house_checklists_updated_at',
            'update_house_files_updated_at', 'update_updated_at_column'
        )
    )
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) RENAME TO %I', func.proname, func.args, 'ic_' || func.proname);
    END LOOP;
END $$;

-- ==========================================
-- 4. UPDATE FUNCTION BODIES
-- ==========================================

CREATE OR REPLACE FUNCTION public.ic_handle_new_role_permissions() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.ic_role_permissions (role_id)
    VALUES (NEW.id)
    ON CONFLICT (role_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_handle_role_deletion_sync() RETURNS trigger AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  FOR v_staff_id IN SELECT id FROM public.ic_staff WHERE role_id = OLD.id LOOP
    PERFORM public.ic_sync_staff_role_to_metadata_for_staff(v_staff_id);
  END LOOP;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  SELECT 
    CASE p_module
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      WHEN 'participants' THEN participants::text
      WHEN 'shift_notes' THEN shift_notes::text
      WHEN 'employees' THEN employees::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      WHEN 'roster_board' THEN roster_board::text
      WHEN 'houses' THEN houses::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions rp
  JOIN public.ic_staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  RETURN COALESCE(auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module, 'none');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id() RETURNS uuid AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  v_staff_id := (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
  IF v_staff_id IS NOT NULL THEN
    RETURN v_staff_id;
  END IF;
  SELECT id INTO v_staff_id FROM public.ic_staff WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_jwt_has_house(p_house_id uuid) RETURNS bool AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ic_house_staff_assignments hsa
    JOIN public.ic_staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
    AND hsa.house_id = p_house_id
    AND (hsa.end_date IS NULL OR hsa.end_date > now())
  ) THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_jwt_is_admin() RETURNS bool AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true OR
    ic_jwt_get_perm('access_control') = 'full'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_jwt_manages_staff(p_staff_id uuid) RETURNS bool AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' -> 'managed_staff_ids') @> jsonb_build_array(p_staff_id::text) THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ic_staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = (SELECT manager_id FROM public.ic_staff WHERE id = p_staff_id)
  ) THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_propagate_role_permission_changes() RETURNS trigger AS $$
DECLARE
  v_staff_record RECORD;
BEGIN
  FOR v_staff_record IN 
    SELECT id FROM public.ic_staff WHERE role_id = NEW.role_id AND auth_user_id IS NOT NULL
  LOOP
    PERFORM public.ic_sync_staff_role_to_metadata_for_staff(v_staff_record.id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_sync_staff_role_to_metadata() RETURNS trigger AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
          'staff_id', NEW.id,
          'last_sync_trigger', now()
        )
    WHERE id = NEW.auth_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_sync_staff_role_to_metadata_for_staff(p_staff_id uuid) RETURNS void AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.ic_staff WHERE id = p_staff_id;
  SELECT name INTO v_role_name FROM public.ic_roles WHERE id = v_staff_record.role_id;
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

CREATE OR REPLACE FUNCTION public.ic_update_compliance_status() RETURNS trigger AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'Expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status := 'Expiring Soon';
    ELSE
      NEW.status := 'Complete';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_update_house_checklist_items_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_update_house_checklists_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_update_house_files_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ic_update_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. RECREATE RLS POLICIES
-- ==========================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Clean up all existing policies on ic_ tables
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'ic_%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
    
    -- Clean up storage policies
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- ic_activity_log
ALTER TABLE public.ic_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RBAC activity_log ALL (Admin)" ON public.ic_activity_log FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC activity_log INSERT" ON public.ic_activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "RBAC activity_log SELECT" ON public.ic_activity_log FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('activity_log') = 'full'));

-- ic_participants
ALTER TABLE public.ic_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RBAC participants ALL (Admin)" ON public.ic_participants FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC participants SELECT" ON public.ic_participants FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('participants') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND ic_jwt_has_house(house_id)));

-- ic_staff
ALTER TABLE public.ic_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RBAC staff ALL (Admin)" ON public.ic_staff FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC staff SELECT" ON public.ic_staff FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (id = ic_jwt_get_staff_id()) OR (ic_jwt_get_perm('employees') = ANY (ARRAY['full', 'read_only'])) OR ic_jwt_manages_staff(id) OR EXISTS (SELECT 1 FROM public.ic_house_staff_assignments hsa WHERE hsa.staff_id = public.ic_staff.id AND ic_jwt_has_house(hsa.house_id)));

-- Storage Policies
CREATE POLICY "RBAC storage_objects ALL (Admin)" ON storage.objects FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC checklist_attachments INSERT" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'ic_checklist-attachments' AND (ic_jwt_is_admin() OR EXISTS (SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE hcs.id::text = split_part(name, '/', 1) AND ic_jwt_has_house(hcs.house_id)))));

-- ==========================================
-- 6. RECREATE TRIGGERS (CLEAN DROP/CREATE)
-- ==========================================
DROP TRIGGER IF EXISTS trigger_handle_new_role_permissions ON public.ic_roles;
CREATE TRIGGER trigger_handle_new_role_permissions AFTER INSERT ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_handle_new_role_permissions();

DROP TRIGGER IF EXISTS trigger_handle_role_deletion_sync ON public.ic_roles;
CREATE TRIGGER trigger_handle_role_deletion_sync BEFORE DELETE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_handle_role_deletion_sync();

DROP TRIGGER IF EXISTS trigger_sync_staff_role_to_metadata ON public.ic_staff;
CREATE TRIGGER trigger_sync_staff_role_to_metadata AFTER INSERT ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_sync_staff_role_to_metadata();

DROP TRIGGER IF EXISTS trigger_sync_staff_role_to_metadata_update ON public.ic_staff;
CREATE TRIGGER trigger_sync_staff_role_to_metadata_update AFTER UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_sync_staff_role_to_metadata();

COMMIT;

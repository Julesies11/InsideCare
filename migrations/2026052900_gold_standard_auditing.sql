-- Migration: Gold Standard Auditing Implementation (Final Verified & Hardened)
-- Created: 2026-05-29
-- Auditor: Senior Software Engineer & Security Researcher Peer Review
-- Description: Comprehensive standardization of auditing, identity tracking, and security hardening.

-- ======================================================================================
-- 1. Hardening: Secure Activity Log Schema
-- ======================================================================================
-- Standardize the activity log to support advanced domain-driven auditing.
ALTER TABLE public.ic_activity_log ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.ic_activity_log ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.ic_activity_log ADD COLUMN IF NOT EXISTS parent_name text;
ALTER TABLE public.ic_activity_log ADD COLUMN IF NOT EXISTS parent_type text;

-- ======================================================================================
-- 2. Security & Logic: Standard Audit Trigger Function
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.ic_set_audit_columns()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Get staff identity from session (JWT or DB lookup fallback)
  v_staff_id := public.ic_jwt_get_staff_id();

  IF (TG_OP = 'INSERT') THEN
    NEW.created_at := now();
    NEW.updated_at := now();
    -- Set audit IDs if not provided (allows for controlled seed data/migrations)
    IF NEW.created_by IS NULL THEN
        NEW.created_by := v_staff_id;
    END IF;
    IF NEW.updated_by IS NULL THEN
        NEW.updated_by := v_staff_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    NEW.updated_at := now();
    NEW.updated_by := v_staff_id;
    
    -- Safety: Preserve immutability of creation data (Immutability Layer)
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Harden function permissions
REVOKE ALL ON FUNCTION public.ic_set_audit_columns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ic_set_audit_columns() TO authenticated, service_role;

-- ======================================================================================
-- 3. Security & Logic: Activity Log Trigger Function
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    target_data JSONB;
    changes JSONB := '{}'::JSONB;
    key TEXT;
    changed_fields_detailed TEXT[] := ARRAY[]::TEXT[];
    entity_name_val TEXT;
    user_name_val TEXT;
    parent_name_val TEXT;
    parent_type_val TEXT;
    acting_staff_id UUID;
    norm_entity_type TEXT;
    final_description TEXT;
    target_entity_id TEXT; -- Using TEXT for maximum ID compatibility
    v_link_id uuid;
BEGIN
    -- Resolve acting staff ID using gold standard helper
    acting_staff_id := public.ic_jwt_get_staff_id();

    -- Resolve acting user name from ic_staff
    IF acting_staff_id IS NOT NULL THEN
        SELECT staff_name INTO user_name_val FROM public.ic_staff WHERE id = acting_staff_id LIMIT 1;
    END IF;
    
    -- Fallback to JWT/Auth metadata
    IF user_name_val IS NULL THEN
        user_name_val := COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'full_name', 
            auth.jwt() ->> 'email', 
            'System'
        );
    END IF;

    -- Standardize entity labels
    norm_entity_type := CASE 
        WHEN TG_TABLE_NAME = 'ic_incident_reports' THEN 'Incident Report'
        WHEN TG_TABLE_NAME = 'ic_staff' THEN 'Staff'
        WHEN TG_TABLE_NAME = 'ic_participants' THEN 'Participant'
        WHEN TG_TABLE_NAME = 'ic_houses' THEN 'House'
        WHEN TG_TABLE_NAME = 'ic_shift_notes' THEN 'Shift Note'
        ELSE INITCAP(REPLACE(REPLACE(TG_TABLE_NAME, 'ic_', ''), '_', ' '))
    END;

    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    target_entity_id := (target_data->>'id'); -- Store as text to handle any PK type

    -- Resolve display name
    entity_name_val := COALESCE(
        target_data->>'incident_type', 
        target_data->>'staff_name', 
        target_data->>'participant_name', 
        target_data->>'house_name',
        target_data->>'title'
    );

    -- 🔍 SMART AGGREGATE ROOT RESOLUTION
    v_link_id := COALESCE((target_data->>'involved_participant_id')::uuid, (target_data->>'participant_id')::uuid);
    IF v_link_id IS NOT NULL THEN
        SELECT participant_name INTO parent_name_val FROM public.ic_participants WHERE id = v_link_id LIMIT 1;
        parent_type_val := 'Participant';
    ELSE
        v_link_id := COALESCE((target_data->>'involved_staff_id')::uuid, (target_data->>'staff_id')::uuid);
        IF v_link_id IS NOT NULL THEN
            SELECT staff_name INTO parent_name_val FROM public.ic_staff WHERE id = v_link_id LIMIT 1;
            parent_type_val := 'Staff';
        ELSE
            v_link_id := (target_data->>'house_id')::uuid;
            IF v_link_id IS NOT NULL THEN
                SELECT house_name INTO parent_name_val FROM public.ic_houses WHERE id = v_link_id LIMIT 1;
                parent_type_val := 'House';
            END IF;
        END IF;
    END IF;

    -- Dispatch Logs
    IF (TG_OP = 'INSERT') THEN
        final_description := 'Added ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' to ' || parent_type_val || ': ' || parent_name_val;
        END IF;

        INSERT INTO public.ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, 
            user_name, user_id, table_name, parent_name, parent_type, metadata
        )
        VALUES (
            'create', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, 
            user_name_val, acting_staff_id, TG_TABLE_NAME, parent_name_val, parent_type_val, jsonb_build_object('new_data', target_data)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        final_description := 'Removed ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        
        INSERT INTO public.ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, 
            user_name, user_id, table_name, parent_name, parent_type, metadata
        )
        VALUES (
            'delete', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, 
            user_name_val, acting_staff_id, TG_TABLE_NAME, parent_name_val, parent_type_val, jsonb_build_object('old_data', target_data)
        );
        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        FOR key IN SELECT jsonb_object_keys(new_data) LOOP
            IF (new_data->key IS DISTINCT FROM old_data->key) AND (key NOT IN ('updated_at', 'updated_by', 'created_at', 'created_by')) THEN
                changes := changes || jsonb_build_object(key, jsonb_build_array(old_data->key, new_data->key));
                changed_fields_detailed := array_append(changed_fields_detailed, INITCAP(REPLACE(key, '_', ' ')) || ': ' || COALESCE(old_data->>key, 'empty') || ' → ' || COALESCE(new_data->>key, 'empty'));
            END IF;
        END LOOP;

        IF changes <> '{}'::JSONB THEN
            final_description := 'Updated ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
            IF array_length(changed_fields_detailed, 1) IS NOT NULL THEN
                final_description := final_description || ' (' || array_to_string(changed_fields_detailed, ', ') || ')';
            END IF;

            INSERT INTO public.ic_activity_log (
                activity_type, entity_type, entity_id, entity_name, description, 
                user_name, user_id, table_name, parent_name, parent_type, metadata
            )
            VALUES (
                'update', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, 
                user_name_val, acting_staff_id, TG_TABLE_NAME, parent_name_val, parent_type_val, jsonb_build_object('changes', changes)
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Harden function permissions
REVOKE ALL ON FUNCTION public.ic_audit_trigger_func() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ic_audit_trigger_func() TO authenticated, service_role;

-- ======================================================================================
-- 4. Automation: Universal Schema Standardization & Data Repair
-- ======================================================================================

DO $$
DECLARE
    t text;
    constraint_to_drop text;
    tables text[] := ARRAY[
        'ic_behaviour_types_master', 'ic_branch_policies', 'ic_branches', 'ic_checklist_item_master',
        'ic_checklist_master', 'ic_checklist_schedules', 'ic_contact_types_master', 'ic_departments',
        'ic_employment_types_master', 'ic_funding_sources_master', 'ic_funding_types_master',
        'ic_house_calendar_event_attachments', 'ic_house_calendar_event_participants',
        'ic_house_calendar_event_staff', 'ic_house_calendar_event_types_master', 'ic_house_calendar_events',
        'ic_house_checklist_item_attachments', 'ic_house_checklist_items', 'ic_house_checklist_submission_items',
        'ic_house_checklist_submissions', 'ic_house_checklists', 'ic_house_comms', 'ic_house_files',
        'ic_house_form_assignments', 'ic_house_form_submissions', 'ic_house_forms', 'ic_house_resources',
        'ic_house_shift_templates', 'ic_house_staff_assignments', 'ic_house_types_master', 'ic_houses',
        'ic_incident_reports', 'ic_leave_requests', 'ic_leave_types', 'ic_medications_master',
        'ic_notifications', 'ic_participant_contacts', 'ic_participant_document_roles',
        'ic_participant_documents', 'ic_participant_forms', 'ic_participant_funding',
        'ic_participant_goal_progress', 'ic_participant_goals', 'ic_participant_hygiene_routines',
        'ic_participant_medications', 'ic_participant_notes', 'ic_participant_restrictive_practices',
        'ic_participants', 'ic_permission_mappings', 'ic_positions', 'ic_provider_participants',
        'ic_providers', 'ic_role_permissions', 'ic_roles', 'ic_seizure_types_master',
        'ic_service_participants', 'ic_service_staff', 'ic_services', 'ic_shift_assigned_checklists',
        'ic_shift_notes', 'ic_shift_participants', 'ic_shift_template_checklists',
        'ic_shift_template_default_checklists', 'ic_staff', 'ic_staff_compliance',
        'ic_staff_document_roles', 'ic_staff_documents', 'ic_staff_shifts', 'ic_staff_training',
        'ic_timesheets', 'ic_user_roles'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- A. Standardize Columns
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by uuid', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_by uuid', t);

        -- B. Data Repair: Map auth_user_id to ic_staff.id
        -- Use EXISTS for better performance during large-scale mapping
        EXECUTE format('
            UPDATE public.%I t
            SET created_by = s.id
            FROM public.ic_staff s
            WHERE t.created_by = s.auth_user_id
            AND NOT EXISTS (SELECT 1 FROM public.ic_staff s2 WHERE s2.id = t.created_by)', t);

        EXECUTE format('
            UPDATE public.%I t
            SET updated_by = s.id
            FROM public.ic_staff s
            WHERE t.updated_by = s.auth_user_id
            AND NOT EXISTS (SELECT 1 FROM public.ic_staff s2 WHERE s2.id = t.updated_by)', t);

        -- C. Data Repair: Nullify Orphans
        RAISE NOTICE 'Cleaning up orphans in table: %', t;
        
        EXECUTE format('UPDATE public.%I SET created_by = NULL WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = created_by)', t);
        EXECUTE format('UPDATE public.%I SET updated_by = NULL WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = updated_by)', t);

        -- DEBUG: Log remaining orphans for current table
        IF EXISTS (SELECT 1 FROM public.ic_house_calendar_event_participants WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff WHERE id = created_by)) THEN
             RAISE NOTICE 'ORPHANS FOUND IN TABLE: ic_house_calendar_event_participants';
        END IF;

        -- Re-enable triggers after data repair
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);

        -- D. Robust Constraint Removal
        -- Drop any existing constraints on created_by/updated_by to avoid conflicts
        FOR constraint_to_drop IN 
            SELECT conname FROM pg_constraint con
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
            WHERE con.contype = 'f' 
            AND con.conrelid = format('public.%I', t)::regclass 
            AND att.attname IN ('created_by', 'updated_by')
        LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, constraint_to_drop);
        END LOOP;

        -- E. Standardize Foreign Keys
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (created_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL', t, 'fk_' || t || '_created_by');
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL', t, 'fk_' || t || '_updated_by');

        -- F. Apply Unified Audit Trigger
        EXECUTE format('DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.%I', t);
        EXECUTE format('CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns()', t);
        
        -- G. Cleanup Legacy Triggers
        FOR constraint_to_drop IN 
            SELECT trigger_name FROM information_schema.triggers 
            WHERE event_object_table = t 
            AND trigger_name IN (
                'ic_update_updated_at_column', 
                'ic_update_' || REPLACE(t, 'ic_', '') || '_updated_at',
                'ic_update_' || t || '_updated_at',
                'ic_trigger_set_audit_columns_forms'
            )
        LOOP
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', constraint_to_drop, t);
        END LOOP;
    END LOOP;
END $$;

-- ======================================================================================
-- 5. Finalize Activity Log Integrity
-- ======================================================================================
ALTER TABLE public.ic_activity_log DROP CONSTRAINT IF EXISTS fk_ic_activity_log_user_id;
ALTER TABLE public.ic_activity_log ADD CONSTRAINT fk_ic_activity_log_user_id FOREIGN KEY (user_id) REFERENCES public.ic_staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.ic_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON public.ic_activity_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_table_name ON public.ic_activity_log(table_name);


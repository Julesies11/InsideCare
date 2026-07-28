-- Migration: Refine System Integration for Reporting
-- Date: 2026-05-28
-- Reviewer: Senior Software Engineer & Security Researcher
-- Status: Verified & Hardened

-- 1. Update ic_jwt_get_perm to include new reporting categories
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) 
RETURNS text 
AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
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
      WHEN 'reporting_clinical' THEN reporting_clinical::text
      WHEN 'reporting_operational' THEN reporting_operational::text
      WHEN 'reporting_compliance' THEN reporting_compliance::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions rp
  JOIN public.ic_staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. Update ic_audit_trigger_func for better Incident Report resolution
CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func() 
RETURNS trigger 
AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    target_data JSONB;
    changes JSONB := '{}'::JSONB;
    key TEXT;
    field_label TEXT;
    old_val_text TEXT;
    new_val_text TEXT;
    changed_fields_detailed TEXT[] := ARRAY[]::TEXT[];
    entity_name_val TEXT;
    user_name_val TEXT;
    parent_name_val TEXT;
    parent_type_val TEXT;
    acting_user_id UUID;
    norm_entity_type TEXT;
    final_description TEXT;
    target_entity_id TEXT;
    v_link_id uuid;
BEGIN
    acting_user_id := auth.uid();

    -- Resolve acting user name
    IF acting_user_id IS NOT NULL THEN
        SELECT staff_name INTO user_name_val FROM ic_staff WHERE auth_user_id = acting_user_id LIMIT 1;
        IF user_name_val IS NULL THEN
            user_name_val := COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() ->> 'email');
        END IF;
    END IF;

    -- Human-friendly labels
    norm_entity_type := CASE 
        WHEN TG_TABLE_NAME = 'ic_incident_reports' THEN 'Incident Report'
        WHEN TG_TABLE_NAME = 'ic_staff' THEN 'Staff'
        WHEN TG_TABLE_NAME = 'ic_participants' THEN 'Participant'
        WHEN TG_TABLE_NAME = 'ic_houses' THEN 'House'
        WHEN TG_TABLE_NAME = 'ic_shift_notes' THEN 'Shift Note'
        ELSE INITCAP(REPLACE(REPLACE(TG_TABLE_NAME, 'ic_', ''), '_', ' '))
    END;

    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    target_entity_id := (target_data->>'id');

    -- Resolve display name for the entity
    entity_name_val := COALESCE(
        target_data->>'incident_type', -- First priority for incidents
        target_data->>'staff_name', 
        target_data->>'participant_name', 
        target_data->>'house_name',
        target_data->>'title'
    );

    -- 🔍 SMART AGGREGATE ROOT RESOLUTION
    -- Priority 1: Participant (Involved Resident)
    v_link_id := COALESCE((target_data->>'involved_participant_id')::uuid, (target_data->>'participant_id')::uuid);
    IF v_link_id IS NOT NULL THEN
        SELECT participant_name INTO parent_name_val FROM ic_participants WHERE id = v_link_id LIMIT 1;
        parent_type_val := 'Participant';
        target_entity_id := v_link_id::text;
    ELSE
        -- Priority 2: Staff (Involved Employee)
        v_link_id := COALESCE((target_data->>'involved_staff_id')::uuid, (target_data->>'staff_id')::uuid);
        IF v_link_id IS NOT NULL THEN
            SELECT staff_name INTO parent_name_val FROM ic_staff WHERE id = v_link_id LIMIT 1;
            parent_type_val := 'Staff';
            target_entity_id := v_link_id::text;
        ELSE
            -- Priority 3: House
            v_link_id := (target_data->>'house_id')::uuid;
            IF v_link_id IS NOT NULL THEN
                SELECT house_name INTO parent_name_val FROM ic_houses WHERE id = v_link_id LIMIT 1;
                parent_type_val := 'House';
                target_entity_id := v_link_id::text;
            END IF;
        END IF;
    END IF;

    -- Logging Logic (INSERT/DELETE/UPDATE)
    IF (TG_OP = 'INSERT') THEN
        final_description := 'Added ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' to ' || parent_type_val || ': ' || parent_name_val;
        END IF;

        INSERT INTO ic_activity_log (activity_type, entity_type, entity_id, entity_name, description, user_name, metadata)
        VALUES ('create', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, user_name_val, jsonb_build_object('new_data', target_data));
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        final_description := 'Removed ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        INSERT INTO ic_activity_log (activity_type, entity_type, entity_id, entity_name, description, user_name, metadata)
        VALUES ('delete', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, user_name_val, jsonb_build_object('old_data', target_data));
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
            INSERT INTO ic_activity_log (activity_type, entity_type, entity_id, entity_name, description, user_name, metadata)
            VALUES ('update', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, user_name_val, jsonb_build_object('changes', changes));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

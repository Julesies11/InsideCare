-- Migration: Add parent_id to activity log and fix document descriptions (Verified Gold Standard)
-- Created: 2026-06-03
-- Description: Adds parent_id for high-performance aggregate root querying and ensures file names are captured in descriptions.
-- Includes backfill for existing records.

-- 1. Add parent_id column and index
ALTER TABLE public.ic_activity_log ADD COLUMN IF NOT EXISTS parent_id uuid;
CREATE INDEX IF NOT EXISTS idx_activity_log_parent_id ON public.ic_activity_log(parent_id);

-- 2. Best-effort backfill for existing logs (INSERTs and DELETEs)
-- We extract the parent ID from the metadata JSONB
UPDATE public.ic_activity_log
SET parent_id = (
    COALESCE(
        (metadata->'new_data'->>'participant_id'),
        (metadata->'old_data'->>'participant_id'),
        (metadata->'new_data'->>'involved_participant_id'),
        (metadata->'old_data'->>'involved_participant_id'),
        (metadata->'new_data'->>'staff_id'),
        (metadata->'old_data'->>'staff_id'),
        (metadata->'new_data'->>'involved_staff_id'),
        (metadata->'old_data'->>'involved_staff_id'),
        (metadata->'new_data'->>'house_id'),
        (metadata->'old_data'->>'house_id')
    )
)::uuid
WHERE parent_id IS NULL AND metadata IS NOT NULL;

-- 3. Update the audit trigger function
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
        WHEN TG_TABLE_NAME = 'ic_staff_documents' THEN 'Document'
        WHEN TG_TABLE_NAME = 'ic_participant_documents' THEN 'Document'
        ELSE INITCAP(REPLACE(REPLACE(TG_TABLE_NAME, 'ic_', ''), '_', ' '))
    END;

    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    target_entity_id := (target_data->>'id'); -- Store as text to handle any PK type

    -- Resolve display name
    entity_name_val := COALESCE(
        target_data->>'file_name', -- Priority for documents
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
            user_name, user_id, table_name, parent_name, parent_type, parent_id, metadata
        )
        VALUES (
            'create', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, 
            user_name_val, acting_staff_id, TG_TABLE_NAME, parent_name_val, parent_type_val, v_link_id, jsonb_build_object('new_data', target_data)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        final_description := 'Removed ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        
        INSERT INTO public.ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, 
            user_name, user_id, table_name, parent_name, parent_type, parent_id, metadata
        )
        VALUES (
            'delete', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, 
            user_name_val, acting_staff_id, TG_TABLE_NAME, parent_name_val, parent_type_val, v_link_id, jsonb_build_object('old_data', target_data)
        );
        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        FOR key IN SELECT jsonb_object_keys(new_data) LOOP
            -- Ignore audit columns and updated_at
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
                user_name, user_id, table_name, parent_name, parent_type, parent_id, metadata
            )
            VALUES (
                'update', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val, final_description, 
                user_name_val, acting_staff_id, TG_TABLE_NAME, parent_name_val, parent_type_val, v_link_id, jsonb_build_object('changes', changes)
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

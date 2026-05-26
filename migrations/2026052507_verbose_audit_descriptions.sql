-- Migration: Verbose Audit Descriptions (From -> To)
-- Date: 2026-05-25
-- Description: Updates the audit trigger to include the actual data changes (from X to Y) directly in the description string.

CREATE OR REPLACE FUNCTION ic_audit_trigger_func()
RETURNS TRIGGER AS $$
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
BEGIN
    -- Capture the acting user from Supabase Auth
    acting_user_id := auth.uid();

    -- Resolve user name
    IF acting_user_id IS NOT NULL THEN
        SELECT staff_name INTO user_name_val FROM ic_staff WHERE auth_user_id = acting_user_id LIMIT 1;
        IF user_name_val IS NULL THEN
            user_name_val := COALESCE(
                auth.jwt() -> 'user_metadata' ->> 'full_name',
                auth.jwt() -> 'user_metadata' ->> 'name',
                auth.jwt() ->> 'email'
            );
        END IF;
    END IF;

    -- Human-friendly entity names
    norm_entity_type := CASE 
        WHEN TG_TABLE_NAME = 'ic_staff' THEN 'Staff'
        WHEN TG_TABLE_NAME = 'ic_participants' THEN 'Participant'
        WHEN TG_TABLE_NAME = 'ic_houses' THEN 'House'
        WHEN TG_TABLE_NAME = 'ic_participant_contacts' THEN 'Contact'
        WHEN TG_TABLE_NAME = 'ic_participant_medications' THEN 'Medication'
        WHEN TG_TABLE_NAME = 'ic_participant_goals' THEN 'Goal'
        WHEN TG_TABLE_NAME = 'ic_staff_compliance' THEN 'Compliance'
        WHEN TG_TABLE_NAME = 'ic_staff_documents' THEN 'Document'
        WHEN TG_TABLE_NAME = 'ic_staff_training' THEN 'Training'
        WHEN TG_TABLE_NAME = 'ic_timesheets' THEN 'Timesheet'
        WHEN TG_TABLE_NAME = 'ic_leave_requests' THEN 'Leave Request'
        ELSE INITCAP(REPLACE(REPLACE(TG_TABLE_NAME, 'ic_', ''), '_', ' '))
    END;

    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    -- Resolve entity name
    entity_name_val := COALESCE(
        target_data->>'staff_name', 
        target_data->>'participant_name', 
        target_data->>'house_name',
        target_data->>'name', 
        target_data->>'title',
        target_data->>'goal_type',
        target_data->>'document_name',
        target_data->>'training_name'
    );

    -- Resolve Parent Context
    IF (target_data->>'participant_id' IS NOT NULL) THEN
        SELECT participant_name INTO parent_name_val FROM ic_participants WHERE id = (target_data->>'participant_id')::uuid LIMIT 1;
        parent_type_val := 'Participant';
    ELSIF (target_data->>'staff_id' IS NOT NULL) THEN
        SELECT staff_name INTO parent_name_val FROM ic_staff WHERE id = (target_data->>'staff_id')::uuid LIMIT 1;
        parent_type_val := 'Staff';
    ELSIF (target_data->>'house_id' IS NOT NULL) THEN
        SELECT house_name INTO parent_name_val FROM ic_houses WHERE id = (target_data->>'house_id')::uuid LIMIT 1;
        parent_type_val := 'House';
    END IF;

    -- INSERT Logic
    IF (TG_OP = 'INSERT') THEN
        final_description := 'Added ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' to ' || parent_type_val || ': ' || parent_name_val;
        END IF;

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'create', REPLACE(TG_TABLE_NAME, 'ic_', ''), (target_data->>'id')::TEXT, entity_name_val,
            final_description, user_name_val, jsonb_build_object('new_data', target_data)
        );
        RETURN NEW;

    -- DELETE Logic
    ELSIF (TG_OP = 'DELETE') THEN
        final_description := 'Removed ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' from ' || parent_type_val || ': ' || parent_name_val;
        END IF;

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'delete', REPLACE(TG_TABLE_NAME, 'ic_', ''), (target_data->>'id')::TEXT, entity_name_val,
            final_description, user_name_val, jsonb_build_object('old_data', target_data)
        );
        RETURN OLD;

    -- UPDATE Logic (The "Gold Standard" change summary)
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        IF (old_data = new_data) THEN RETURN NEW; END IF;

        FOR key IN SELECT jsonb_object_keys(new_data) LOOP
            -- Skip noise fields
            IF key IN ('updated_at', 'created_at', 'photo_file', 'last_sign_in_at', 'search_vector') THEN CONTINUE; END IF;

            IF (old_data->key IS DISTINCT FROM new_data->key) THEN
                -- 1. Labeling
                field_label := CASE key
                    WHEN 'staff_name' THEN 'Name'
                    WHEN 'participant_name' THEN 'Name'
                    WHEN 'house_name' THEN 'Name'
                    WHEN 'status' THEN 'Status'
                    WHEN 'email' THEN 'Email'
                    WHEN 'phone' THEN 'Phone'
                    WHEN 'role_id' THEN 'Role'
                    WHEN 'house_id' THEN 'House'
                    WHEN 'ndis_number' THEN 'NDIS Number'
                    WHEN 'date_of_birth' THEN 'Date of Birth'
                    WHEN 'participant_id' THEN 'Participant Assignment'
                    WHEN 'staff_id' THEN 'Staff Assignment'
                    ELSE INITCAP(REPLACE(key, '_', ' '))
                END;

                -- 2. Format values for string summary
                old_val_text := COALESCE(NULLIF(old_data->>key, ''), '(empty)');
                new_val_text := COALESCE(NULLIF(new_data->>key, ''), '(empty)');

                -- 3. Append to detailed summary list
                changed_fields_detailed := array_append(changed_fields_detailed, field_label || ': ' || old_val_text || ' → ' || new_val_text);
                
                -- 4. Add to metadata JSON
                changes := changes || jsonb_build_object(key, jsonb_build_object('old', old_data->key, 'new', new_data->key));
            END IF;
        END LOOP;

        IF (changes = '{}'::JSONB) THEN RETURN NEW; END IF;

        final_description := 'Updated ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' for ' || parent_type_val || ': ' || parent_name_val;
        END IF;
        
        -- Append the Verbose Change Summary
        final_description := final_description || ' [' || array_to_string(changed_fields_detailed, ', ') || ']';

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'update', REPLACE(TG_TABLE_NAME, 'ic_', ''), (target_data->>'id')::TEXT, entity_name_val,
            final_description, user_name_val, jsonb_build_object('changes', changes)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in ic_audit_trigger_func for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

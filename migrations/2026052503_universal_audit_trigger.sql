-- Migration: Universal Audit Trigger for Gold Standard Logging
-- Date: 2026-05-25
-- Description: Creates a highly performant PL/pgSQL function to automatically log data changes (INSERT, UPDATE, DELETE).

-- 1. Create the universal audit function
CREATE OR REPLACE FUNCTION ic_audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changes JSONB := '{}'::JSONB;
    key TEXT;
    val RECORD;
    entity_name_val TEXT;
    user_name_val TEXT;
    acting_user_id UUID;
BEGIN
    -- Capture the acting user from Supabase Auth
    acting_user_id := auth.uid();

    -- Resolve user name if possible
    IF acting_user_id IS NOT NULL THEN
        -- 1. Try to find in InsideCare staff table
        SELECT staff_name INTO user_name_val FROM ic_staff WHERE auth_user_id = acting_user_id LIMIT 1;
        
        -- 2. Fallback to auth metadata if not in staff table
        IF user_name_val IS NULL THEN
            user_name_val := COALESCE(
                auth.jwt() -> 'user_metadata' ->> 'full_name',
                auth.jwt() -> 'user_metadata' ->> 'name',
                auth.jwt() ->> 'email'
            );
        END IF;
    END IF;

    -- Handle different operations
    IF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
        
        -- Try to find a name for the entity being deleted
        entity_name_val := COALESCE(
            old_data->>'staff_name', 
            old_data->>'participant_name', 
            old_data->>'name', 
            old_data->>'title'
        );

        INSERT INTO ic_activity_log (
            activity_type,
            entity_type,
            entity_id,
            entity_name,
            description,
            user_name,
            metadata
        ) VALUES (
            'delete',
            TG_TABLE_NAME::TEXT,
            (old_data->>'id')::TEXT,
            entity_name_val,
            'Deleted ' || REPLACE(TG_TABLE_NAME::TEXT, 'ic_', '') || ': ' || COALESCE(entity_name_val, (old_data->>'id')::TEXT),
            user_name_val,
            jsonb_build_object('old_data', old_data)
        );
        RETURN OLD;

    ELSIF (TG_OP = 'INSERT') THEN
        new_data := to_jsonb(NEW);
        
        entity_name_val := COALESCE(
            new_data->>'staff_name', 
            new_data->>'participant_name', 
            new_data->>'name', 
            new_data->>'title'
        );

        INSERT INTO ic_activity_log (
            activity_type,
            entity_type,
            entity_id,
            entity_name,
            description,
            user_name,
            metadata
        ) VALUES (
            'create',
            TG_TABLE_NAME::TEXT,
            (new_data->>'id')::TEXT,
            entity_name_val,
            'Created ' || REPLACE(TG_TABLE_NAME::TEXT, 'ic_', '') || ': ' || COALESCE(entity_name_val, (new_data->>'id')::TEXT),
            user_name_val,
            jsonb_build_object('new_data', new_data)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        -- Performance optimization: Only proceed if JSON has actually changed
        IF (old_data = new_data) THEN
            RETURN NEW;
        END IF;

        -- Calculate diff
        FOR key IN SELECT jsonb_object_keys(new_data)
        LOOP
            -- Skip system fields
            IF key IN ('updated_at', 'created_at', 'photo_file', 'last_sign_in_at') THEN
                CONTINUE;
            END IF;

            -- Only record if values are different
            IF (old_data->key IS DISTINCT FROM new_data->key) THEN
                changes := changes || jsonb_build_object(key, jsonb_build_object('old', old_data->key, 'new', new_data->key));
            END IF;
        END LOOP;

        -- Only log if actual non-system fields changed
        IF (changes = '{}'::JSONB) THEN
            RETURN NEW;
        END IF;

        entity_name_val := COALESCE(
            new_data->>'staff_name', 
            new_data->>'participant_name', 
            new_data->>'name', 
            new_data->>'title'
        );

        INSERT INTO ic_activity_log (
            activity_type,
            entity_type,
            entity_id,
            entity_name,
            description,
            user_name,
            metadata
        ) VALUES (
            'update',
            TG_TABLE_NAME::TEXT,
            (new_data->>'id')::TEXT,
            entity_name_val,
            'Updated ' || REPLACE(TG_TABLE_NAME::TEXT, 'ic_', '') || ': ' || COALESCE(entity_name_val, (new_data->>'id')::TEXT),
            user_name_val,
            jsonb_build_object('changes', changes)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- Resiliency: Never allow an auditing error to block a data update
    RAISE WARNING 'Error in ic_audit_trigger_func for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach triggers to core tables
-- Staff table
DROP TRIGGER IF EXISTS ic_audit_staff_trigger ON ic_staff;
CREATE TRIGGER ic_audit_staff_trigger
AFTER INSERT OR UPDATE OR DELETE ON ic_staff
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

-- Participants table
DROP TRIGGER IF EXISTS ic_audit_participants_trigger ON ic_participants;
CREATE TRIGGER ic_audit_participants_trigger
AFTER INSERT OR UPDATE OR DELETE ON ic_participants
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

-- Houses table
DROP TRIGGER IF EXISTS ic_audit_houses_trigger ON ic_houses;
CREATE TRIGGER ic_audit_houses_trigger
AFTER INSERT OR UPDATE OR DELETE ON ic_houses
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

-- Roles table
DROP TRIGGER IF EXISTS ic_audit_roles_trigger ON ic_roles;
CREATE TRIGGER ic_audit_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON ic_roles
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

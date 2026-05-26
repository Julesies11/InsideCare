-- Migration: Gold Standard Activity Log RBAC
-- Date: 2026-05-25
-- Description: Refactors Activity Log RLS policies to allow contextual history access based on parent module permissions.

-- 1. Update the universal audit function to use standard module keys for entity_type
-- This makes RLS mapping much cleaner.
CREATE OR REPLACE FUNCTION ic_audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changes JSONB := '{}'::JSONB;
    key TEXT;
    entity_name_val TEXT;
    user_name_val TEXT;
    acting_user_id UUID;
    norm_entity_type TEXT;
BEGIN
    -- Normalize entity type to match RBAC module keys where possible
    norm_entity_type := CASE 
        WHEN TG_TABLE_NAME = 'ic_staff' THEN 'employees'
        WHEN TG_TABLE_NAME = 'ic_participants' THEN 'participants'
        WHEN TG_TABLE_NAME = 'ic_houses' THEN 'houses'
        ELSE REPLACE(TG_TABLE_NAME, 'ic_', '')
    END;

    -- Capture the acting user from Supabase Auth
    acting_user_id := auth.uid();

    -- Resolve user name if possible
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

    -- Handle different operations
    IF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
        entity_name_val := COALESCE(old_data->>'staff_name', old_data->>'participant_name', old_data->>'house_name', old_data->>'name', old_data->>'title');

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'delete', norm_entity_type, (old_data->>'id')::TEXT, entity_name_val,
            'Deleted ' || norm_entity_type || ': ' || COALESCE(entity_name_val, (old_data->>'id')::TEXT),
            user_name_val, jsonb_build_object('old_data', old_data)
        );
        RETURN OLD;

    ELSIF (TG_OP = 'INSERT') THEN
        new_data := to_jsonb(NEW);
        entity_name_val := COALESCE(new_data->>'staff_name', new_data->>'participant_name', new_data->>'house_name', new_data->>'name', new_data->>'title');

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'create', norm_entity_type, (new_data->>'id')::TEXT, entity_name_val,
            'Created ' || norm_entity_type || ': ' || COALESCE(entity_name_val, (new_data->>'id')::TEXT),
            user_name_val, jsonb_build_object('new_data', new_data)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        IF (old_data = new_data) THEN RETURN NEW; END IF;

        FOR key IN SELECT jsonb_object_keys(new_data) LOOP
            IF key IN ('updated_at', 'created_at', 'photo_file', 'last_sign_in_at') THEN CONTINUE; END IF;
            IF (old_data->key IS DISTINCT FROM new_data->key) THEN
                changes := changes || jsonb_build_object(key, jsonb_build_object('old', old_data->key, 'new', new_data->key));
            END IF;
        END LOOP;

        IF (changes = '{}'::JSONB) THEN RETURN NEW; END IF;

        entity_name_val := COALESCE(new_data->>'staff_name', new_data->>'participant_name', new_data->>'house_name', new_data->>'name', new_data->>'title');

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'update', norm_entity_type, (new_data->>'id')::TEXT, entity_name_val,
            'Updated ' || norm_entity_type || ': ' || COALESCE(entity_name_val, (new_data->>'id')::TEXT),
            user_name_val, jsonb_build_object('changes', changes)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in ic_audit_trigger_func for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Drop existing "blunt" SELECT policy
DROP POLICY IF EXISTS "RBAC activity_log SELECT" ON ic_activity_log;

-- 3. Implement Granular Gold Standard SELECT Policies

-- A. Global Auditor Policy (Admins can see everything)
CREATE POLICY "RBAC Activity Log - Global Auditor" 
ON ic_activity_log FOR SELECT
USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('activity_log') IN ('read', 'context_read_write', 'full')
);

-- B. Participant Context Policy (Care staff can see participant history and related child entities)
CREATE POLICY "RBAC Activity Log - Participant Context" 
ON ic_activity_log FOR SELECT
USING (
    (entity_type IN ('participants', 'participant') OR entity_type LIKE 'participant_%' OR entity_type = 'shift_notes') AND 
    ic_jwt_get_perm('participants') IN ('context_read', 'context_read_write', 'full')
);

-- C. Staff Context Policy (Managers can see staff history and related child entities)
CREATE POLICY "RBAC Activity Log - Staff Context" 
ON ic_activity_log FOR SELECT
USING (
    (entity_type IN ('employees', 'staff') OR entity_type LIKE 'staff_%' OR entity_type IN ('leave_requests', 'timesheets')) AND 
    ic_jwt_get_perm('employees') IN ('context_read', 'context_read_write', 'full')
);

-- D. House Context Policy (Staff can see house history)
CREATE POLICY "RBAC Activity Log - House Context" 
ON ic_activity_log FOR SELECT
USING (
    (entity_type IN ('houses', 'house') OR entity_type LIKE 'house_%') AND 
    ic_jwt_get_perm('houses') IN ('read', 'context_read', 'context_read_write', 'full')
);

-- E. Auth Context Policy (Allow users to see their own login logs)
CREATE POLICY "RBAC Activity Log - Self Auth" 
ON ic_activity_log FOR SELECT
USING (
    entity_type = 'auth' AND entity_id = auth.uid()::text
);

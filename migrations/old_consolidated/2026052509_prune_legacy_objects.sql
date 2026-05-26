-- Migration: Prune Legacy Objects
-- Date: 2026-05-25
-- Description: Removes obsolete triggers and functions to clean up the schema and prevent redundant operations.

-- 1. CLEANUP: Obsolete JWT Sync Triggers (superseded by Edge Function dispatcher)
DROP TRIGGER IF EXISTS ic_trigger_sync_staff_role_to_metadata ON ic_staff;
DROP TRIGGER IF EXISTS ic_trigger_sync_staff_role_to_metadata_update ON ic_staff;

-- 2. CLEANUP: Obsolete Role Propagation Triggers (points to legacy functions)
DROP TRIGGER IF EXISTS ic_trigger_handle_new_role_permissions ON ic_roles;
DROP TRIGGER IF EXISTS ic_trigger_handle_role_deletion_sync ON ic_roles;

-- 3. UPGRADE: Standardize remaining security triggers to use the Gold Standard dispatcher
-- When role permissions change, we need to sync all staff belonging to that role
CREATE OR REPLACE FUNCTION ic_propagate_role_sync_webhook()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  FOR v_staff_id IN SELECT id FROM ic_staff WHERE role_id = NEW.role_id LOOP
    PERFORM net.http_post(
        url := 'https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_ANON_KEY' -- 👈 Handled in Prod via migration search/replace
        ),
        body := jsonb_build_object(
            'table', 'ic_staff',
            'type', 'UPDATE',
            'userId', (SELECT auth_user_id FROM ic_staff WHERE id = v_staff_id)
        )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ic_propagate_role_permission_changes ON ic_role_permissions;
CREATE TRIGGER ic_propagate_role_permission_changes
AFTER UPDATE ON ic_role_permissions
FOR EACH ROW EXECUTE FUNCTION ic_propagate_role_sync_webhook();

-- 4. CLEANUP: Confusion/Duplicate Triggers
DROP TRIGGER IF EXISTS ic_update_participant_documents_updated_at_2 ON ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns_forms
BEFORE INSERT OR UPDATE ON ic_participant_forms
FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();

-- 5. DROP: Obsolete Functions (no longer used by any active triggers)
DROP FUNCTION IF EXISTS ic_sync_staff_role_to_metadata();
DROP FUNCTION IF EXISTS ic_sync_staff_role_to_metadata_for_staff(uuid);
DROP FUNCTION IF EXISTS ic_handle_new_role_permissions();
DROP FUNCTION IF EXISTS ic_handle_role_deletion_sync();
DROP FUNCTION IF EXISTS ic_propagate_role_permission_changes();

-- 6. AUDIT: Explicit entry for the cleanup
INSERT INTO ic_activity_log (
    activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
) VALUES (
    'delete', 'system', 'cleanup_20260525', 'Legacy Pruning',
    'Database cleanup: Removed obsolete SQL sync functions and triggers. Standardized security propagation.',
    'System',
    jsonb_build_object('removed_triggers_count', 5, 'removed_functions_count', 5)
);

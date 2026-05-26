-- Migration: Setup Login Auditing and Portal Tracking
-- Date: 2026-05-25
-- Description: Records the deployment of enhanced auditing and portal access tracking.

-- Note: The ic-auth-webhook Edge Function must be manually linked in the 
-- Supabase Dashboard (Auth -> Hooks) to activate live login logging.

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
    'system',
    'security_update_20260525',
    'Audit & Portal Enhancement',
    'Deployed enhanced System Activity Log with login tracking and detailed portal access monitoring.',
    'System',
    jsonb_build_object(
        'features', jsonb_build_array('login_webhook', 'portal_status_tracking', 'activity_data_grid'),
        'deployment_date', now()
    )
);

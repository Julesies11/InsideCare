-- Migration: Comprehensive RBAC Hardening: Enable Admin INSERT/UPDATE for all Lookup Tables
BEGIN;

-- Full list of Master/Lookup Tables identified in schema_metadata.json
DO $$
DECLARE
    master_tables text[] := ARRAY[
        'ic_checklist_master',
        'ic_checklist_item_master',
        'ic_medications_master',
        'ic_contact_types_master',
        'ic_departments',
        'ic_employment_types_master',
        'ic_funding_sources_master',
        'ic_funding_types_master',
        'ic_house_types_master',
        'ic_house_calendar_event_types_master',
        'ic_leave_types',
        'ic_roles',
        'ic_positions'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY master_tables
    LOOP
        -- Drop and Create INSERT policy
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I INSERT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I INSERT" ON public.%I FOR INSERT TO authenticated WITH CHECK (ic_jwt_is_admin())', t, t);
        
        -- Drop and Create UPDATE policy
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I UPDATE" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I UPDATE" ON public.%I FOR UPDATE TO authenticated USING (ic_jwt_is_admin())', t, t);
    END LOOP;
END $$;

COMMIT;

-- Migration: Restore Missing RBAC Policies (INSERT/DELETE)
-- Date: 2026-05-31
-- Description: Adds missing INSERT and DELETE policies for core tables that were dropped or omitted during granular migration.

BEGIN;

-- 1. Restore ic_houses Policies
DROP POLICY IF EXISTS "RBAC houses INSERT" ON public.ic_houses;
CREATE POLICY "RBAC houses INSERT" ON public.ic_houses FOR INSERT TO authenticated WITH CHECK (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('houses') = 'full'
);

DROP POLICY IF EXISTS "RBAC houses DELETE" ON public.ic_houses;
CREATE POLICY "RBAC houses DELETE" ON public.ic_houses FOR DELETE TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('houses') = 'full'
);

-- 2. Restore ic_participants Policies
DROP POLICY IF EXISTS "RBAC participants INSERT" ON public.ic_participants;
CREATE POLICY "RBAC participants INSERT" ON public.ic_participants FOR INSERT TO authenticated WITH CHECK (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participants') = 'full' OR
    ((ic_jwt_get_perm('participants') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC participants DELETE" ON public.ic_participants;
CREATE POLICY "RBAC participants DELETE" ON public.ic_participants FOR DELETE TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participants') = 'full'
);

-- 3. Restore ic_staff Policies
DROP POLICY IF EXISTS "RBAC staff INSERT" ON public.ic_staff;
CREATE POLICY "RBAC staff INSERT" ON public.ic_staff FOR INSERT TO authenticated WITH CHECK (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('employees') = 'full'
);

DROP POLICY IF EXISTS "RBAC staff DELETE" ON public.ic_staff;
CREATE POLICY "RBAC staff DELETE" ON public.ic_staff FOR DELETE TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('employees') = 'full'
);

-- 4. Restore Master Lists INSERT (Admin Only)
-- This is a generic pattern for master tables
DO $$
DECLARE
    t text;
    master_tables text[] := ARRAY[
        'ic_branches', 
        'ic_roles', 
        'ic_departments', 
        'ic_employment_types_master', 
        'ic_medications_master', 
        'ic_house_types_master',
        'ic_checklist_master',
        'ic_contact_types_master',
        'ic_funding_sources_master',
        'ic_funding_types_master'
    ];
BEGIN
    FOREACH t IN ARRAY master_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s INSERT" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %s INSERT" ON public.%I FOR INSERT TO authenticated WITH CHECK (ic_jwt_is_admin())', t, t);
        
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s DELETE" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %s DELETE" ON public.%I FOR DELETE TO authenticated USING (ic_jwt_is_admin())', t, t);
    END LOOP;
END $$;

COMMIT;

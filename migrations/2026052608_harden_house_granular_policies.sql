-- Migration: Harden House Granular Policies
-- Date: 2026-05-26
-- Description: Updates RLS policies for checklists, resources, and activity logs to use the new granular house permissions.

BEGIN;

-- 1. Update ic_house_resources policies to use 'house_resources' instead of generic 'houses'
DROP POLICY IF EXISTS "RBAC house_resources ALL" ON public.ic_house_resources;
CREATE POLICY "RBAC house_resources ALL" ON public.ic_house_resources FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('house_resources') = 'full' OR 
    ((ic_jwt_get_perm('house_resources') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_resources SELECT" ON public.ic_house_resources;
CREATE POLICY "RBAC house_resources SELECT" ON public.ic_house_resources FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_has_house(house_id) OR 
    (ic_jwt_get_perm('house_resources') IN ('full', 'read_only', 'context_read_write', 'context_read_only'))
);

-- 2. Update Activity Log House Context to use 'house_activity_log'
DROP POLICY IF EXISTS "RBAC Activity Log - House Context" ON public.ic_activity_log;
CREATE POLICY "RBAC Activity Log - House Context" ON public.ic_activity_log FOR SELECT TO public USING (
    ((entity_type = ANY (ARRAY['houses'::text, 'house'::text])) OR (entity_type ~~ 'house_%'::text)) AND 
    (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('houses'::text) IN ('read', 'context_read', 'context_read_write', 'full')) OR
        (ic_jwt_get_perm('house_activity_log'::text) IN ('read', 'context_read', 'context_read_write', 'full'))
    )
);

-- 3. Update ic_house_forms to use 'house_operations'
DROP POLICY IF EXISTS "RBAC house_forms ALL" ON public.ic_house_forms;
CREATE POLICY "RBAC house_forms ALL" ON public.ic_house_forms FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('house_operations') = 'full' OR 
    ((ic_jwt_get_perm('house_operations') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_forms SELECT" ON public.ic_house_forms;
CREATE POLICY "RBAC house_forms SELECT" ON public.ic_house_forms FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_has_house(house_id) OR 
    (ic_jwt_get_perm('house_operations') IN ('full', 'read_only', 'context_read_write', 'context_read_only'))
);

COMMIT;

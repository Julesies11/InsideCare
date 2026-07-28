-- Migration: Synchronize House RBAC Logic
-- Date: 2026-05-26
-- Description: Broadens the ic_houses SELECT policy to be inclusive of all granular house modules.

BEGIN;

-- Update ic_houses SELECT policy to include all granular modules
DROP POLICY IF EXISTS "RBAC houses SELECT" ON public.ic_houses;
CREATE POLICY "RBAC houses SELECT" ON public.ic_houses FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('houses') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_management') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_operations') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_checklists') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_checklist_history') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_resources') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_staff') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('house_activity_log') IN ('full', 'read_only', 'context_read_write', 'context_read_only')
);

COMMIT;

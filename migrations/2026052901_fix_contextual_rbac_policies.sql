-- Simplified Contextual RLS Policy Regression Fix
-- 2026052901_fix_contextual_rbac_policies.sql

BEGIN;

-- 1. Fix ic_participants SELECT Policy: Simplify to House Context
DROP POLICY IF EXISTS "RBAC participants SELECT" ON public.ic_participants;
CREATE POLICY "RBAC participants SELECT" ON public.ic_participants FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participants') IN ('full', 'read_only') OR
    (ic_jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND ic_jwt_has_house(house_id))
);

-- 2. Fix ic_staff SELECT Policy: Simplify to Manager/House Context
DROP POLICY IF EXISTS "RBAC staff SELECT" ON public.ic_staff;
CREATE POLICY "RBAC staff SELECT" ON public.ic_staff FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    (auth.uid() = auth_user_id) OR
    ic_jwt_get_perm('employees') IN ('full', 'read_only') OR
    (ic_jwt_get_perm('employees') IN ('context_read_write', 'context_read_only') AND (ic_jwt_manages_staff(id) OR EXISTS(SELECT 1 FROM ic_house_staff_assignments hsa WHERE hsa.staff_id = ic_staff.id AND ic_jwt_has_house(hsa.house_id))))
);

-- 3. Fix ic_houses SELECT Policy: Simplify to House Context
DROP POLICY IF EXISTS "RBAC houses SELECT" ON public.ic_houses;
CREATE POLICY "RBAC houses SELECT" ON public.ic_houses FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('houses') IN ('full', 'read_only') OR
    (ic_jwt_get_perm('houses') IN ('context_read_write', 'context_read_only') AND ic_jwt_has_house(id))
);

COMMIT;

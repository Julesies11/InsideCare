-- ==============================================================================
-- 🚨 ARCHITECTURAL RESET: PURE JWT RLS MODEL 🚨
-- ==============================================================================
-- This migration implements the True Supabase Gold Standard.
-- 1. Helper functions ONLY read from the JWT (Zero DB Lookups = Zero Recursion).
-- 2. Policies are flattened to rely entirely on these fast JWT checks.

-- ------------------------------------------------------------------------------
-- PHASE 1: FLATTEN RLS HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
-- These functions are now "Dumb". They only read the JWT. No DB lookups ever.
-- We use IMMUTABLE to ensure extreme performance during large table scans.

CREATE OR REPLACE FUNCTION public.ic_jwt_is_admin() RETURNS bool AS $$
BEGIN
  RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(auth.jwt() -> 'app_metadata' ->> 'staff_id', '')::uuid;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) RETURNS text AS $$
BEGIN
  RETURN COALESCE(auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module, 'none');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.ic_jwt_has_house(p_house_id uuid) RETURNS bool AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text), 
    false
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ------------------------------------------------------------------------------
-- PHASE 2: PURE JWT CORE POLCIES
-- ------------------------------------------------------------------------------
-- We replace the complex, recursive policies with simple JWT-based checks.

-- ic_staff
DROP POLICY IF EXISTS "RBAC staff SELECT" ON public.ic_staff;
DROP POLICY IF EXISTS "RBAC staff SELECT SELF" ON public.ic_staff;
CREATE POLICY "RBAC staff SELECT" ON public.ic_staff 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  id = ic_jwt_get_staff_id() OR 
  ic_jwt_get_perm('employees') IN ('full', 'read_only')
);

-- ic_house_staff_assignments
DROP POLICY IF EXISTS "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments;
CREATE POLICY "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_get_perm('employees') IN ('full', 'read_only', 'context_read_write', 'context_read_only')
);

-- ic_houses
DROP POLICY IF EXISTS "RBAC houses SELECT" ON public.ic_houses;
CREATE POLICY "RBAC houses SELECT" ON public.ic_houses 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  ic_jwt_get_perm('houses') IN ('full', 'read_only') OR 
  ic_jwt_has_house(id)
);

-- ic_participants
DROP POLICY IF EXISTS "RBAC participants SELECT" ON public.ic_participants;
CREATE POLICY "RBAC participants SELECT" ON public.ic_participants 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  ic_jwt_get_perm('participants') IN ('full', 'read_only') OR 
  ic_jwt_has_house(house_id)
);

-- ic_staff_shifts
DROP POLICY IF EXISTS "RBAC staff_shifts SELECT" ON public.ic_staff_shifts;
DROP POLICY IF EXISTS "RBAC ic_staff_shifts SELECT" ON public.ic_staff_shifts;
DROP POLICY IF EXISTS "RBAC ic_staff_shifts ALL (Admin)" ON public.ic_staff_shifts;
CREATE POLICY "RBAC staff_shifts SELECT" ON public.ic_staff_shifts 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_get_perm('my_roster') IN ('full', 'read_only') OR
  ic_jwt_get_perm('roster_board') IN ('full', 'read_only')
);

-- ------------------------------------------------------------------------------
-- PHASE 3: MASTER LISTS (Baseline visibility)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC checklist_master SELECT" ON public.ic_checklist_master;
CREATE POLICY "RBAC checklist_master SELECT" ON public.ic_checklist_master FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC leave_types SELECT" ON public.ic_leave_types;
CREATE POLICY "RBAC leave_types SELECT" ON public.ic_leave_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC departments SELECT" ON public.ic_departments;
CREATE POLICY "RBAC departments SELECT" ON public.ic_departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC employment_types_master SELECT" ON public.ic_employment_types_master;
CREATE POLICY "RBAC employment_types_master SELECT" ON public.ic_employment_types_master FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC house_types_master SELECT" ON public.ic_house_types_master;
CREATE POLICY "RBAC house_types_master SELECT" ON public.ic_house_types_master FOR SELECT TO authenticated USING (true);

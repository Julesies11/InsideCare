-- FINAL HARDENING: Direct Path RLS
-- This migration simplifies the ic_staff SELECT policy to avoid function overhead
-- and ensures the search_path includes the auth schema for helper functions.

-- 1. Add a direct, non-recursive policy for "Self" lookups on ic_staff
-- This is the "Gold Standard" for performance and stability.
DROP POLICY IF EXISTS "RBAC staff SELECT SELF" ON public.ic_staff;
CREATE POLICY "RBAC staff SELECT SELF" ON public.ic_staff 
FOR SELECT TO authenticated 
USING (auth_user_id = auth.uid());

-- 2. Update the main SELECT policy to remove the recursive function call for self-checks
-- We keep the admin and permission checks as they are handled by the SECURITY DEFINER functions.
DROP POLICY IF EXISTS "RBAC staff SELECT" ON public.ic_staff;
CREATE POLICY "RBAC staff SELECT" ON public.ic_staff 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  ic_jwt_get_perm('employees') IN ('full', 'read_only') OR 
  ic_jwt_manages_staff(id)
);

-- 3. Fix the search_path in all helper functions to include 'auth'
-- This ensures they can correctly resolve auth.uid() and auth.jwt()
ALTER FUNCTION public.ic_jwt_get_staff_id() SET search_path = public, auth;
ALTER FUNCTION public.ic_jwt_get_perm(text) SET search_path = public, auth;
ALTER FUNCTION public.ic_jwt_is_admin() SET search_path = public, auth;
ALTER FUNCTION public.ic_jwt_has_house(uuid) SET search_path = public, auth;
ALTER FUNCTION public.ic_jwt_manages_staff(uuid) SET search_path = public, auth;

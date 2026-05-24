-- BREAKING THE RECURSION: ic_house_staff_assignments
-- This migration removes the circular dependency where ic_house_staff_assignments 
-- used itself as a lookup source for its own RLS policy.

-- 1. Create a "Safe" non-RLS version of the house check for internal use
-- This function is SECURITY DEFINER and specifically DOES NOT call itself in a loop.
CREATE OR REPLACE FUNCTION public.ic_jwt_has_house_internal(p_house_id uuid) 
RETURNS bool 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check JWT metadata (Fast & Safe)
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;

  -- Fallback to DB (Safe because it's a direct ID lookup)
  RETURN EXISTS (
    SELECT 1 FROM public.ic_house_staff_assignments
    WHERE house_id = p_house_id 
    AND staff_id = public.ic_jwt_get_staff_id()
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Flatten the RLS policy for ic_house_staff_assignments
-- We remove the call to ic_jwt_has_house() which was the source of the recursion.
DROP POLICY IF EXISTS "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments;
CREATE POLICY "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_get_perm('employees') IN ('full', 'read_only')
);

-- 3. Update the main ic_houses policy to use the internal safe check
-- This prevents ic_houses from triggering a loop back into the assignments table.
DROP POLICY IF EXISTS "RBAC houses SELECT" ON public.ic_houses;
CREATE POLICY "RBAC houses SELECT" ON public.ic_houses 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  ic_jwt_get_perm('houses') IN ('full', 'read_only') OR 
  ic_jwt_has_house_internal(id)
);

-- 4. Harden ic_jwt_manages_staff to avoid recursive JOINs
CREATE OR REPLACE FUNCTION public.ic_jwt_manages_staff(p_staff_id uuid) 
RETURNS bool 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Admin always manages everyone
  IF ic_jwt_is_admin() THEN
    RETURN true;
  END IF;

  -- Staff member manages themselves
  IF p_staff_id = public.ic_jwt_get_staff_id() THEN
    RETURN true;
  END IF;

  -- Managers can see staff in houses they are assigned to
  RETURN EXISTS (
    SELECT 1 
    FROM public.ic_house_staff_assignments hsa_target
    JOIN public.ic_house_staff_assignments hsa_manager ON hsa_manager.house_id = hsa_target.house_id
    WHERE hsa_target.staff_id = p_staff_id
    AND hsa_manager.staff_id = public.ic_jwt_get_staff_id()
    AND public.ic_jwt_get_perm('employees') IN ('context_read_write', 'context_read_only')
  );
END;
$$ LANGUAGE plpgsql;

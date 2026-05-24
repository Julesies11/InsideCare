-- Fix infinite RLS recursion in ic_jwt_get_staff_id
-- This function was calling SELECT on ic_staff, which triggered the RLS policy calling this function.

CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id() 
RETURNS uuid 
SECURITY DEFINER -- This allows the function to bypass RLS for its internal lookup
SET search_path = public -- Best practice for security definer functions
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- 1. Try to get it from the JWT metadata (Fastest)
  BEGIN
    v_staff_id := (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_staff_id := NULL;
  END;

  IF v_staff_id IS NOT NULL THEN
    RETURN v_staff_id;
  END IF;

  -- 2. Fallback to database lookup if not in JWT
  -- This SELECT will now bypass RLS because of SECURITY DEFINER
  SELECT id INTO v_staff_id 
  FROM public.ic_staff 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;

  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql;

-- Also update ic_jwt_has_house to be SECURITY DEFINER to avoid similar potential recursion
CREATE OR REPLACE FUNCTION public.ic_jwt_has_house(p_house_id uuid) 
RETURNS bool 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Check JWT metadata
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;

  -- 2. Fallback to database lookup
  IF EXISTS (
    SELECT 1 FROM public.ic_house_staff_assignments hsa
    WHERE hsa.house_id = p_house_id 
    AND hsa.staff_id = public.ic_jwt_get_staff_id()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Finally, ensure ic_roles has a SELECT policy for authenticated users
-- Without this, the join in the profile query will return NULL for the role.
DROP POLICY IF EXISTS "RBAC roles SELECT" ON public.ic_roles;
CREATE POLICY "RBAC roles SELECT" ON public.ic_roles 
FOR SELECT TO authenticated 
USING (true);

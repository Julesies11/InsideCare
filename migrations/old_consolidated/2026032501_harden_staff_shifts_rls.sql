-- Migration: Harden RLS for staff_shifts
-- Date: 2026-03-25
-- Description: Restricts staff shift visibility to own shifts or Open Shifts in assigned houses.

-- 1. Drop existing permissive policy
DROP POLICY IF EXISTS "Staff can select staff shifts" ON public.staff_shifts;

-- 2. Create refined policy for Staff
-- Logic: 
--  - Can see shifts assigned to them (staff_id = their staff id)
--  - OR Can see "Open Shifts" (staff_id is NULL) for houses they are assigned to
CREATE POLICY "Staff can select scoped shifts" ON public.staff_shifts 
FOR SELECT 
TO authenticated 
USING (
    -- Admin check (already covered by global admin policy, but good for clarity if that fails)
    ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
    OR
    -- Supervisor check (if they have the role in metadata or via a join)
    ((auth.jwt() -> 'user_metadata' ->> 'role_name') ILIKE '%Supervisor%')
    OR
    -- Own shifts
    (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()))
    OR
    -- Open shifts for assigned houses
    (staff_id IS NULL AND house_id IN (
        SELECT house_id 
        FROM public.house_staff_assignments hsa 
        JOIN public.staff s ON s.id = hsa.staff_id 
        WHERE s.auth_user_id = auth.uid()
    ))
);

-- 3. Ensure Staff can read House assignments (needed for the join above)
-- Existing policies might already cover this, but we'll be explicit.
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can select assigned house staff" ON public.house_staff_assignments;
CREATE POLICY "Staff can select house assignments" ON public.house_staff_assignments
FOR SELECT
TO authenticated
USING (true); -- Usually safe for staff to see who else is in their house

-- 4. Comment for documentation
COMMENT ON POLICY "Staff can select scoped shifts" ON public.staff_shifts IS 'Restricts staff to own shifts or Open Shifts in their assigned houses.';

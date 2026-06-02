-- Migration: Fix Staff Shifts SELECT RBAC for Roster Board Context
-- Created: 2026-06-02
-- Description: Ensures Roster Managers with contextual permissions can SELECT shifts for their assigned houses, preventing "permission denied" errors on updates.

-- 1. Add contextual SELECT policy for ic_staff_shifts
-- This ensures that when a manager updates a shift, they can see the returned data if they match the house.
CREATE POLICY "RBAC staff_shifts SELECT (Roster Board Context)" ON public.ic_staff_shifts
FOR SELECT TO authenticated
USING (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') IN ('full', 'read_only')) OR 
  ((ic_jwt_get_perm('roster_board') IN ('context_read_write', 'context_read_only')) AND ic_jwt_has_house(house_id))
);

-- 2. Audit existing SELECT policies for staff_shifts to ensure no RESTRICTIVE policies exist
-- (Research confirmed only PERMISSIVE policies exist for ic_staff_shifts)

-- 3. Ensure Roster Managers can also see staff assigned to their houses (for the join)
-- This is often already covered by 'employees' context, but we add a specific policy for roster visibility.
CREATE POLICY "RBAC staff SELECT (Roster Board Context)" ON public.ic_staff
FOR SELECT TO authenticated
USING (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') IS NOT NULL) AND (
    EXISTS (
      SELECT 1 FROM public.ic_house_staff_assignments hsa
      WHERE hsa.staff_id = ic_staff.id 
      AND ic_jwt_has_house(hsa.house_id)
    )
  )
);

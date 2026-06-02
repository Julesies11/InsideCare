-- Migration: Fix Shift Junction Policies
-- Description: Adds SELECT policies to ic_shift_participants and ic_shift_assigned_checklists to allow staff to see their own assignments.

-- 1. ic_shift_participants SELECT policy
DROP POLICY IF EXISTS "RBAC staff_participants SELECT" ON public.ic_shift_participants;
CREATE POLICY "RBAC staff_participants SELECT" ON public.ic_shift_participants
FOR SELECT
TO authenticated
USING (
    ic_jwt_is_admin() OR
    (EXISTS (
        SELECT 1 FROM public.ic_staff_shifts ss
        WHERE ss.id = shift_id AND ss.staff_id = ic_jwt_get_staff_id()
    ))
);

-- 2. ic_shift_assigned_checklists SELECT policy
DROP POLICY IF EXISTS "RBAC shift_assigned_checklists SELECT" ON public.ic_shift_assigned_checklists;
CREATE POLICY "RBAC shift_assigned_checklists SELECT" ON public.ic_shift_assigned_checklists
FOR SELECT
TO authenticated
USING (
    ic_jwt_is_admin() OR
    (EXISTS (
        SELECT 1 FROM public.ic_staff_shifts ss
        WHERE ss.id = shift_id AND ss.staff_id = ic_jwt_get_staff_id()
    ))
);

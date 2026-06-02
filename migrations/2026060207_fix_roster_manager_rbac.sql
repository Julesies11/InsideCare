-- Migration: Fix Roster Manager RBAC for Shift Participants and Checklists
-- Created: 2026-06-02
-- Description: Grants Roster Managers (users with roster_board permission) access to shift participants and assigned checklists.

-- 1. RBAC ic_shift_participants (Roster Manager ALL)
CREATE POLICY "RBAC ic_shift_participants - Roster Manager" ON public.ic_shift_participants
FOR ALL TO authenticated
USING (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') = 'full') OR 
  ((ic_jwt_get_perm('roster_board') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_staff_shifts ss WHERE ss.id = shift_id AND ic_jwt_has_house(ss.house_id))))
)
WITH CHECK (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') = 'full') OR 
  ((ic_jwt_get_perm('roster_board') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_staff_shifts ss WHERE ss.id = shift_id AND ic_jwt_has_house(ss.house_id))))
);

-- 2. RBAC ic_shift_participants (Roster Manager SELECT)
CREATE POLICY "RBAC staff_participants SELECT (Roster Board)" ON public.ic_shift_participants
FOR SELECT TO authenticated
USING (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') IN ('full', 'read_only')) OR 
  ((ic_jwt_get_perm('roster_board') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_staff_shifts ss WHERE ss.id = shift_id AND ic_jwt_has_house(ss.house_id))))
);

-- 3. RBAC ic_shift_assigned_checklists (Roster Manager ALL)
CREATE POLICY "RBAC ic_shift_assigned_checklists - Roster Manager" ON public.ic_shift_assigned_checklists
FOR ALL TO authenticated
USING (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') = 'full') OR 
  ((ic_jwt_get_perm('roster_board') = 'context_read_write') AND ic_jwt_has_house(house_id))
)
WITH CHECK (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') = 'full') OR 
  ((ic_jwt_get_perm('roster_board') = 'context_read_write') AND ic_jwt_has_house(house_id))
);

-- 4. RBAC ic_shift_assigned_checklists (Roster Manager SELECT)
CREATE POLICY "RBAC shift_assigned_checklists SELECT (Roster Board)" ON public.ic_shift_assigned_checklists
FOR SELECT TO authenticated
USING (
  ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('roster_board') IN ('full', 'read_only')) OR 
  ((ic_jwt_get_perm('roster_board') IN ('context_read_write', 'context_read_only')) AND ic_jwt_has_house(house_id))
);

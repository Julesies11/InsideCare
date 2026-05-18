-- Migration: Fix Roster & Core Visibility
-- Description: Restores missing SELECT policies for staff/participants and standardizes roster RLS.

BEGIN;

-- ========================================================================================
-- 1. RESTORE STAFF SELECT ACCESS (Critical for get_my_staff_id())
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR -- Self-view
    (get_access_level('manage_staff'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_staff'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        (public.is_staff_managed_by(id, public.get_my_staff_id()) OR public.do_staff_share_house(id, public.get_my_staff_id()))
    )
  );

-- ========================================================================================
-- 2. RESTORE PARTICIPANTS SELECT ACCESS (Critical for Roster joins)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_participants'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    ) OR
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) -- Fallback for support workers
  );

-- ========================================================================================
-- 3. FIX STAFF SHIFTS POLICIES (Use canonical keys)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
DROP POLICY IF EXISTS "RBAC Shifts ALL (Admin/Full/Context)" ON public.staff_shifts;

CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR -- Own shifts
    (get_access_level('manage_roster_board'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('manage_roster_board'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id())))
  );

CREATE POLICY "RBAC Shifts ALL" ON public.staff_shifts
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_roster_board'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_roster_board'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_roster_board'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_roster_board'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- ========================================================================================
-- 4. FIX ROSTER JUNCTION POLICIES
-- ========================================================================================

-- Shift Participants
DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
DROP POLICY IF EXISTS "RBAC Shift Participants ALL (Admin/Full/Context)" ON public.shift_participants;

CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_participants.shift_id AND (ss.staff_id = get_my_staff_id() OR is_staff_assigned_to_house(get_my_staff_id(), ss.house_id))))
  );

CREATE POLICY "RBAC Shift Participants ALL" ON public.shift_participants
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_roster_board'::text) = 'full'::access_level_enum) OR 
    (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_participants.shift_id AND (get_access_level('manage_roster_board'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), ss.house_id)))
  );

-- Shift Assigned Checklists
DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_assigned_checklists.shift_id AND (ss.staff_id = get_my_staff_id() OR is_staff_assigned_to_house(get_my_staff_id(), ss.house_id))))
  );

COMMIT;

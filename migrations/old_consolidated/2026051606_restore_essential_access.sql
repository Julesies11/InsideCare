-- Migration: Restore Essential SELECT Access
-- Description: Restores missing SELECT policies for staff and participants to enable profile views and operations.

BEGIN;

-- ========================================================================================
-- 1. RESTORE STAFF SELECT ACCESS
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;

CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR -- Self-view (Critical for profile/photo)
    (get_access_level('manage_staff'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_staff'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        (
            public.do_staff_share_house(public.get_my_staff_id(), id) OR
            public.is_staff_managed_by(id, public.get_my_staff_id())
        )
    )
  );

-- ========================================================================================
-- 2. RESTORE PARTICIPANTS SELECT ACCESS
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
    )
  );

COMMIT;

-- Migration: Fix RLS Recursion in Calendar Events
-- Description: Uses a SECURITY DEFINER helper to break circular dependencies between events and staff junction tables.

BEGIN;

-- 1. Create SECURITY DEFINER helper to safely check event access without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_staff_linked_to_calendar_event(p_staff_id UUID, p_event_id UUID)
RETURNS boolean AS $$
BEGIN
    -- Check direct assignment in junction table
    IF EXISTS (
        SELECT 1 FROM public.house_calendar_event_staff
        WHERE event_id = p_event_id AND staff_id = p_staff_id
    ) THEN
        RETURN true;
    END IF;

    -- Check house assignment from parent event
    RETURN EXISTS (
        SELECT 1 FROM public.house_calendar_events hce
        WHERE hce.id = p_event_id AND public.is_staff_assigned_to_house(p_staff_id, hce.house_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. REBUILD POLICIES USING THE HELPER
-- ========================================================================================

-- House Calendar Events
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_linked_to_calendar_event(get_my_staff_id(), id)
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), id))
  );

-- House Calendar Event Staff (Junction)
DROP POLICY IF EXISTS "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff;
DROP POLICY IF EXISTS "RBAC Calendar Event Staff ALL (Admin/Full/Context)" ON public.house_calendar_event_staff;

CREATE POLICY "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (staff_id = get_my_staff_id()) OR
    is_staff_linked_to_calendar_event(get_my_staff_id(), event_id)
  );

CREATE POLICY "RBAC Calendar Event Staff ALL" ON public.house_calendar_event_staff
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  );

-- House Calendar Event Participants (Junction)
DROP POLICY IF EXISTS "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants;
DROP POLICY IF EXISTS "RBAC Calendar Event Participants ALL (Admin/Full/Context)" ON public.house_calendar_event_participants;

CREATE POLICY "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_linked_to_calendar_event(get_my_staff_id(), event_id)
  );

CREATE POLICY "RBAC Calendar Event Participants ALL" ON public.house_calendar_event_participants
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  );

COMMIT;

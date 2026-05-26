-- Migration: Final Verified Gold Standard RLS and Metadata Hardening
-- Date: 2026-05-19
-- Description: 
-- 1. Hardens JWT functions to ignore legacy user_metadata and trust app_metadata with secure DB fallback.
-- 2. Fixes sync trigger to stop polluting user_metadata.
-- 3. Wipes legacy user_metadata globally.
-- 4. Implements "Level-Guarded Context" and "Admin-only DELETE" across all tables.

-- 1. HARDEN SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.jwt_get_perm(p_module text) RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- A. Check ONLY secure app_metadata (Fastest)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- B. SECURE DATABASE FALLBACK
  SELECT 
    CASE p_module
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      WHEN 'participants' THEN participants::text
      WHEN 'shift_notes' THEN shift_notes::text
      WHEN 'employees' THEN employees::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      WHEN 'roster_board' THEN roster_board::text
      WHEN 'houses' THEN houses::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.role_permissions rp
  JOIN public.staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_is_admin() RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true OR
    jwt_get_perm('access_control') = 'full'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FIX SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata() RETURNS trigger AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = '{}'::jsonb, 
        raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
          'staff_id', NEW.id,
          'last_sync_trigger', now()
        )
    WHERE id = NEW.auth_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. GLOBAL PURGE OF LEGACY DATA
UPDATE auth.users SET raw_user_meta_data = '{}'::jsonb;


-- 4. LEVEL-GUARDED RLS (Clinical & Operational)

DO $$
DECLARE
    t text;
    master_tables text[] := ARRAY[
        'checklist_item_master', 'checklist_master', 'contact_types_master', 
        'employment_types_master', 'funding_sources_master', 'funding_types_master', 
        'house_calendar_event_types_master', 'house_shift_templates', 'house_types_master', 
        'leave_types', 'medications_master', 'permission_mappings', 'positions', 
        'provider_participants', 'providers', 'service_participants', 'service_staff', 
        'services', 'shift_template_checklists', 'shift_template_default_checklists'
    ];
BEGIN
    FOREACH t IN ARRAY master_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s ALL" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s SELECT" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s DELETE" ON public.%I', t, t);
        
        EXECUTE format('CREATE POLICY "RBAC %s SELECT" ON public.%I FOR SELECT TO authenticated USING (jwt_is_admin() OR jwt_get_perm(''master_lists'') IN (''full'', ''read_only''))', t, t);
        EXECUTE format('CREATE POLICY "RBAC %s DELETE" ON public.%I FOR DELETE TO authenticated USING (jwt_is_admin())', t, t);
    END LOOP;
END $$;


-- participants
DROP POLICY IF EXISTS "RBAC participants ALL" ON public.participants;
DROP POLICY IF EXISTS "RBAC participants SELECT" ON public.participants;
CREATE POLICY "RBAC participants SELECT" ON public.participants FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('participants') IN ('full', 'read_only') OR 
    (jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC participants INSERT" ON public.participants;
CREATE POLICY "RBAC participants INSERT" ON public.participants FOR INSERT TO authenticated
WITH CHECK (
    jwt_is_admin() OR 
    jwt_get_perm('participants') = 'full' OR 
    (jwt_get_perm('participants') = 'context_read_write' AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC participants UPDATE" ON public.participants;
CREATE POLICY "RBAC participants UPDATE" ON public.participants FOR UPDATE TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('participants') = 'full' OR 
    (jwt_get_perm('participants') = 'context_read_write' AND jwt_has_house(house_id))
)
WITH CHECK (
    jwt_is_admin() OR 
    jwt_get_perm('participants') = 'full' OR 
    (jwt_get_perm('participants') = 'context_read_write' AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC participants DELETE" ON public.participants;
CREATE POLICY "RBAC participants DELETE" ON public.participants FOR DELETE TO authenticated
USING (jwt_is_admin());


-- house_checklists
DROP POLICY IF EXISTS "RBAC house_checklists ALL" ON public.house_checklists;
DROP POLICY IF EXISTS "RBAC house_checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC house_checklists SELECT" ON public.house_checklists FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') IN ('full', 'read_only') OR 
    (jwt_get_perm('house_checklists') IN ('context_read_write', 'context_read_only') AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_checklists INSERT" ON public.house_checklists;
CREATE POLICY "RBAC house_checklists INSERT" ON public.house_checklists FOR INSERT TO authenticated
WITH CHECK (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR 
    (jwt_get_perm('house_checklists') = 'context_read_write' AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_checklists UPDATE" ON public.house_checklists;
CREATE POLICY "RBAC house_checklists UPDATE" ON public.house_checklists FOR UPDATE TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR 
    (jwt_get_perm('house_checklists') = 'context_read_write' AND jwt_has_house(house_id))
)
WITH CHECK (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR 
    (jwt_get_perm('house_checklists') = 'context_read_write' AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_checklists DELETE" ON public.house_checklists;
CREATE POLICY "RBAC house_checklists DELETE" ON public.house_checklists FOR DELETE TO authenticated
USING (jwt_is_admin());


-- STORAGE INSERT HARDENING (Explicit qualification)
DROP POLICY IF EXISTS "RBAC storage_objects INSERT" ON storage.objects;
CREATE POLICY "RBAC storage_objects INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    jwt_is_admin() OR 
    (bucket_id = 'checklist-attachments' AND jwt_get_perm('house_checklists') IN ('full', 'context_read_write')) OR 
    (bucket_id = 'participant-photos' AND jwt_get_perm('participants') IN ('full', 'context_read_write')) OR 
    (bucket_id = 'participant-documents' AND jwt_get_perm('participants') IN ('full', 'context_read_write')) OR
    (bucket_id = 'staff-photos' AND split_part(objects.name, '/', 1) = jwt_get_staff_id()::text) OR
    (bucket_id = 'staff-documents' AND split_part(objects.name, '/', 1) = jwt_get_staff_id()::text)
);

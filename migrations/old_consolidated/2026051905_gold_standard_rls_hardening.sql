-- Migration: Gold Standard RLS Hardening (Final Idempotent Version)
-- Date: 2026-05-19
-- Description: Splits 'ALL' policies into granular SELECT, INSERT, UPDATE, DELETE to prevent permissive bypasses.
-- Implements "Level-Guarded Context" and "Admin-only DELETE" project-wide.
-- Ensures idempotency by dropping all specific policy names before creation.

-- 1. HARDEN WORLD-READABLE MASTER LISTS
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
        -- Drop all possible variations to ensure clean state
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s ALL" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s SELECT" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s INSERT" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s UPDATE" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %s DELETE" ON public.%I', t, t);
        
        -- Create Hardened Select
        EXECUTE format('CREATE POLICY "RBAC %s SELECT" ON public.%I FOR SELECT TO authenticated USING (jwt_is_admin() OR jwt_get_perm(''master_lists'') IN (''full'', ''read_only''))', t, t);
        
        -- Enforce Admin-only Delete
        EXECUTE format('CREATE POLICY "RBAC %s DELETE" ON public.%I FOR DELETE TO authenticated USING (jwt_is_admin())', t, t);
    END LOOP;
END $$;


-- 2. OPERATIONAL TABLES (House Scoped)

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


-- house_checklist_submissions
DROP POLICY IF EXISTS "RBAC house_checklist_submissions ALL" ON public.house_checklist_submissions;
DROP POLICY IF EXISTS "RBAC house_checklist_submissions SELECT" ON public.house_checklist_submissions;
CREATE POLICY "RBAC house_checklist_submissions SELECT" ON public.house_checklist_submissions FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') IN ('full', 'read_only') OR 
    (jwt_get_perm('house_checklists') IN ('context_read_write', 'context_read_only') AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_checklist_submissions INSERT" ON public.house_checklist_submissions;
CREATE POLICY "RBAC house_checklist_submissions INSERT" ON public.house_checklist_submissions FOR INSERT TO authenticated
WITH CHECK (
    jwt_is_admin() OR 
    jwt_get_perm('house_checklists') = 'full' OR 
    (jwt_get_perm('house_checklists') = 'context_read_write' AND jwt_has_house(house_id))
);

DROP POLICY IF EXISTS "RBAC house_checklist_submissions UPDATE" ON public.house_checklist_submissions;
CREATE POLICY "RBAC house_checklist_submissions UPDATE" ON public.house_checklist_submissions FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "RBAC house_checklist_submissions DELETE" ON public.house_checklist_submissions;
CREATE POLICY "RBAC house_checklist_submissions DELETE" ON public.house_checklist_submissions FOR DELETE TO authenticated
USING (jwt_is_admin());


-- 3. CLINICAL RECORDS (Participant Scoped)

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


-- shift_notes
DROP POLICY IF EXISTS "RBAC shift_notes ALL" ON public.shift_notes;
DROP POLICY IF EXISTS "RBAC shift_notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC shift_notes SELECT" ON public.shift_notes FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    staff_id = jwt_get_staff_id() OR 
    jwt_get_perm('shift_notes') IN ('full', 'read_only') OR 
    (jwt_get_perm('shift_notes') IN ('context_read_write', 'context_read_only') AND (jwt_manages_staff(staff_id) OR jwt_has_house(house_id)))
);

DROP POLICY IF EXISTS "RBAC shift_notes INSERT" ON public.shift_notes;
CREATE POLICY "RBAC shift_notes INSERT" ON public.shift_notes FOR INSERT TO authenticated
WITH CHECK (
    jwt_is_admin() OR 
    staff_id = jwt_get_staff_id() OR 
    jwt_get_perm('shift_notes') = 'full' OR 
    (jwt_get_perm('shift_notes') = 'context_read_write' AND (jwt_manages_staff(staff_id) OR jwt_has_house(house_id)))
);

DROP POLICY IF EXISTS "RBAC shift_notes UPDATE" ON public.shift_notes;
CREATE POLICY "RBAC shift_notes UPDATE" ON public.shift_notes FOR UPDATE TO authenticated
USING (
    jwt_is_admin() OR 
    staff_id = jwt_get_staff_id() OR 
    jwt_get_perm('shift_notes') = 'full' OR 
    (jwt_get_perm('shift_notes') = 'context_read_write' AND (jwt_manages_staff(staff_id) OR jwt_has_house(house_id)))
)
WITH CHECK (
    jwt_is_admin() OR 
    staff_id = jwt_get_staff_id() OR 
    jwt_get_perm('shift_notes') = 'full' OR 
    (jwt_get_perm('shift_notes') = 'context_read_write' AND (jwt_manages_staff(staff_id) OR jwt_has_house(house_id)))
);

DROP POLICY IF EXISTS "RBAC shift_notes DELETE" ON public.shift_notes;
CREATE POLICY "RBAC shift_notes DELETE" ON public.shift_notes FOR DELETE TO authenticated
USING (jwt_is_admin());


-- 4. STORAGE INSERT HARDENING
DROP POLICY IF EXISTS "RBAC storage_objects INSERT" ON storage.objects;
CREATE POLICY "RBAC storage_objects INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    jwt_is_admin() OR 
    (bucket_id = 'checklist-attachments' AND jwt_get_perm('house_checklists') IN ('full', 'context_read_write')) OR 
    (bucket_id = 'participant-photos' AND jwt_get_perm('participants') IN ('full', 'context_read_write')) OR 
    (bucket_id = 'participant-documents' AND jwt_get_perm('participants') IN ('full', 'context_read_write')) OR
    (bucket_id = 'staff-photos' AND split_part(name, '/', 1) = jwt_get_staff_id()::text) OR
    (bucket_id = 'staff-documents' AND split_part(name, '/', 1) = jwt_get_staff_id()::text)
);

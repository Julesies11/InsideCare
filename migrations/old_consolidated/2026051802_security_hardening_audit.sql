-- ========================================================================================
-- SECURITY HARDENING & AUDIT RECOVERY (REFINED SCHEMA + TYPE SAFE)
-- Date: 2026-05-18
-- Objective: Secure orphaned tables, harden permissive policies, and fix storage regression.
-- ========================================================================================

BEGIN;

-- 1. DROP REMAINING PLACEHOLDER / LEGACY POLICIES
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename, schemaname
    FROM pg_policies 
    WHERE (schemaname = 'public')
    AND (
      policyname IN (
        'Admins can manage shift assignments',
        'Allow all users to view shift_participants',
        'Allow all users to insert shift_participants',
        'Allow all users to delete shift_participants',
        'Allow all users to update shift_participants',
        'Allow all users to view staff_shifts',
        'Allow all users to insert staff_shifts',
        'Allow all users to update staff_shifts',
        'Allow all users to delete staff_shifts',
        'Users delete own notifications',
        'Users insert notifications',
        'Users select own notifications',
        'Users update own notifications'
      ) OR 
      policyname NOT LIKE 'RBAC %'
    )
    AND tablename NOT IN ('spatial_ref_sys') -- Avoid system tables
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;


-- 2. HARDEN HOUSE CHECKLIST SUBMISSIONS
DROP POLICY IF EXISTS "RBAC house_checklist_submissions ALL" ON public.house_checklist_submissions;
CREATE POLICY "RBAC house_checklist_submissions ALL" ON public.house_checklist_submissions FOR ALL TO authenticated
USING (public.jwt_is_admin() OR (public.jwt_get_perm('house_checklists') = 'context_read_write' AND public.jwt_has_house(house_id)));

CREATE POLICY "RBAC house_checklist_submissions DELETE" ON public.house_checklist_submissions FOR DELETE TO authenticated
USING (public.jwt_is_admin());


-- 3. SECURE SHIFT ASSIGNED CHECKLISTS
DROP POLICY IF EXISTS "RBAC shift_assigned_checklists ALL" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC shift_assigned_checklists ALL" ON public.shift_assigned_checklists FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    (public.jwt_get_perm('roster_board') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM public.staff_shifts ss WHERE ss.id = shift_id AND public.jwt_has_house(ss.house_id)
    ))
);


-- 4. SECURE VERIFIED MASTER/GLOBAL TABLES
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'branch_policies', 'funding_claims', 'funding_invoices', 'permission_mappings', 
        'provider_participants', 'service_participants', 'service_staff', 
        'shift_template_checklists', 'shift_template_default_checklists', 
        'user_roles'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (public.jwt_is_admin() OR (public.jwt_get_perm(''master_lists'') = ''full''))', t, t);
    END LOOP;
END $$;


-- 5. SECURE VERIFIED HOUSE-CONTEXT TABLES
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'house_form_assignments', 'house_form_submissions', 'house_forms'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF t = 'house_forms' THEN
            EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated 
                USING (public.jwt_is_admin() OR public.jwt_has_house(house_id) OR public.jwt_get_perm(''houses'') IN (''full'', ''read_only''))', t, t);
            EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
                USING (public.jwt_is_admin() OR (public.jwt_get_perm(''houses'') = ''context_read_write'' AND public.jwt_has_house(house_id)))', t, t);
        ELSE
            EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated 
                USING (public.jwt_is_admin() OR EXISTS (SELECT 1 FROM public.house_forms hf WHERE hf.id = public.%I.form_id AND public.jwt_has_house(hf.house_id)) OR public.jwt_get_perm(''houses'') IN (''full'', ''read_only''))', t, t, t);
            EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
                USING (public.jwt_is_admin() OR (public.jwt_get_perm(''houses'') = ''context_read_write'' AND EXISTS (SELECT 1 FROM public.house_forms hf WHERE hf.id = public.%I.form_id AND public.jwt_has_house(hf.house_id))))', t, t, t);
        END IF;
    END LOOP;
END $$;

-- 6. SECURE VERIFIED CHILD TABLES
-- house_calendar_event_attachments (Linked to event -> house)
CREATE POLICY "RBAC house_calendar_event_attachments SELECT" ON public.house_calendar_event_attachments FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_calendar_events hce WHERE hce.id = event_id AND (public.jwt_has_house(hce.house_id) OR public.jwt_get_perm('houses') IN ('full', 'read_only')))
);

CREATE POLICY "RBAC house_calendar_event_attachments ALL" ON public.house_calendar_event_attachments FOR ALL TO authenticated
USING (
    public.jwt_is_admin() OR 
    EXISTS (SELECT 1 FROM public.house_calendar_events hce WHERE hce.id = event_id AND (public.jwt_has_house(hce.house_id) AND public.jwt_get_perm('houses') = 'context_read_write'))
);


-- 7. ALIGN STORAGE POLICIES
DROP POLICY IF EXISTS "RBAC storage_objects ALL" ON storage.objects;
CREATE POLICY "RBAC storage_objects ALL" ON storage.objects FOR ALL TO authenticated
USING (public.jwt_is_admin());

-- Dedicated INSERT policy for Staff
-- HARDENING: Ensure type safety for UUID comparisons.
CREATE POLICY "RBAC storage_objects INSERT (Staff)" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    public.jwt_is_admin() OR
    (bucket_id = 'checklist-attachments' AND public.jwt_get_perm('house_checklists') = 'context_read_write') OR
    (bucket_id = 'participant-photos' AND public.jwt_get_perm('participants') = 'context_read_write') OR
    (bucket_id = 'staff-photos' AND owner = auth.uid())
);

-- Ensure public bucket remains readable
DROP POLICY IF EXISTS "RBAC storage_objects SELECT" ON storage.objects;
CREATE POLICY "RBAC storage_objects SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    public.jwt_is_admin() OR 
    bucket_id = 'public' OR
    (bucket_id = 'staff-photos') OR
    (bucket_id = 'participant-photos') OR
    (bucket_id = 'checklist-attachments' AND EXISTS (
        SELECT 1 FROM public.house_staff_assignments hsa 
        WHERE hsa.staff_id = public.jwt_get_staff_id() 
        AND (hsa.end_date IS NULL OR hsa.end_date > now())
    ))
);

COMMIT;

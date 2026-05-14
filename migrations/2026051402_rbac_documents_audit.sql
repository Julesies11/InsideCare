-- ========================================================================================
-- RBAC DOCUMENTS & COMPLIANCE AUDIT 2026-05-14
-- Objective: Secure documents, compliance, and secondary house tables identified in audit.
-- ========================================================================================

-- 1. CLEANUP OLD POLICIES FOR THESE TABLES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'participant_documents', 'participant_funding', 'house_files', 
            'staff_documents', 'staff_compliance', 'staff_training',
            'house_forms', 'house_form_assignments', 'house_form_submissions'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 2. PARTICIPANT DOCUMENTS (Context: House Assignment)
CREATE POLICY "RBAC Participant Documents SELECT" ON public.participant_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_documents') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            JOIN public.house_staff_assignments hsa ON hsa.house_id = p.house_id
            WHERE p.id = public.participant_documents.participant_id
            AND hsa.staff_id = public.get_my_staff_id()
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC Participant Documents ALL (Admin/Full)" ON public.participant_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full'
);

-- 3. HOUSE FILES (Context: House Assignment)
CREATE POLICY "RBAC House Files SELECT" ON public.house_files
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_documents') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_files.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC House Files ALL (Admin/Full)" ON public.house_files
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_documents') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_documents') = 'full'
);

-- 4. STAFF DOCUMENTS (Context: Managerial Line or House Assignment)
CREATE POLICY "RBAC Staff Documents SELECT" ON public.staff_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_documents') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_documents') = 'context_locked' AND
        (
            -- Managers can see their reports' documents
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.staff_documents.staff_id
                AND s.manager_id = public.get_my_staff_id()
            ) OR
            -- Staff assigned to same house can see documents (if not restricted)
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa1
                JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
                WHERE hsa1.staff_id = public.get_my_staff_id()
                AND hsa2.staff_id = public.staff_documents.staff_id
                AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
                AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
            )
        )
    )
);

CREATE POLICY "RBAC Staff Documents ALL (Admin/Full)" ON public.staff_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_documents') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_documents') = 'full'
);

-- 5. STAFF COMPLIANCE & TRAINING (Inherit from staff_profiles)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN VALUES ('staff_compliance'), ('staff_training') LOOP
        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''staff_profiles'') IN (''full'', ''read_only'') OR
                staff_id = public.get_my_staff_id() OR
                (
                    public.get_access_level(''staff_profiles'') = ''context_locked'' AND
                    EXISTS (
                        SELECT 1 FROM public.staff s
                        WHERE s.id = public.%I.staff_id
                        AND s.manager_id = public.get_my_staff_id()
                    )
                )
            );
        ', t, t, t);
    END LOOP;
END $$;

-- 6. PARTICIPANT FUNDING (Inherit from participant_profiles)
CREATE POLICY "RBAC Participant Funding SELECT" ON public.participant_funding
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            JOIN public.house_staff_assignments hsa ON hsa.house_id = p.house_id
            WHERE p.id = public.participant_funding.participant_id
            AND hsa.staff_id = public.get_my_staff_id()
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

-- 7. HOUSE FORMS & SUBMISSIONS (Inherit from house_checklists)
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES ('house_forms'), ('house_form_assignments'), ('house_form_submissions') LOOP
        -- Special handling for child tables that link via form_id
        IF t IN ('house_form_assignments', 'house_form_submissions') THEN
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.form_id';
        ELSE
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') IN (''full'', ''read_only'') OR
                (
                    public.get_access_level(''house_checklists'') = ''context_locked'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);
    END LOOP;
END $$;

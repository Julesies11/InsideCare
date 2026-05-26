-- Security Hardening & Operational Audit Fixes (2026-05-18)

-- 1. Activity Logging Fix
-- Standard staff must be able to log their own activities.
-- Note: activity_log uses user_name (text), not user_id.
DROP POLICY IF EXISTS "RBAC activity_log INSERT" ON public.activity_log;
CREATE POLICY "RBAC activity_log INSERT" ON public.activity_log 
FOR INSERT TO authenticated 
WITH CHECK (true); 

-- 2. Staff Visibility (Colleagues)
-- Allow staff to see colleagues who are assigned to the same houses
DROP POLICY IF EXISTS "RBAC staff SELECT" ON public.staff;
CREATE POLICY "RBAC staff SELECT" ON public.staff 
FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    auth_user_id = auth.uid() OR 
    public.jwt_get_perm('employees') IN ('full', 'read_only') OR 
    public.jwt_manages_staff(id) OR
    EXISTS (
        SELECT 1 FROM public.house_staff_assignments hsa 
        WHERE hsa.staff_id = public.staff.id AND public.jwt_has_house(hsa.house_id)
    )
);

-- 3. House Management Omissions
-- Allow editing house staff assignments for admins and HR
CREATE POLICY "RBAC house_staff_assignments ALL" ON public.house_staff_assignments 
FOR ALL TO authenticated 
USING (public.jwt_is_admin() OR public.jwt_get_perm('employees') = 'full');

-- Allow uploading/managing house resources and files for house managers
DROP POLICY IF EXISTS "RBAC house_files ALL" ON public.house_files;
CREATE POLICY "RBAC house_files ALL" ON public.house_files 
FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('houses') = 'full' OR 
    (public.jwt_get_perm('houses') = 'context_read_write' AND public.jwt_has_house(house_id))
);

CREATE POLICY "RBAC house_resources ALL" ON public.house_resources 
FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('houses') = 'full' OR 
    (public.jwt_get_perm('houses') = 'context_read_write' AND public.jwt_has_house(house_id))
);

-- 4. Participant Detail Editing
-- Allow context-aware staff to update primary participant records
DROP POLICY IF EXISTS "RBAC participants ALL" ON public.participants;
CREATE POLICY "RBAC participants ALL" ON public.participants 
FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('participants') = 'full' OR 
    (public.jwt_get_perm('participants') = 'context_read_write' AND public.jwt_has_house(house_id))
);

-- 5. Financial Data Protection (Contextual Hardening)
-- Link funding claims to their house via participant_funding
DROP POLICY IF EXISTS "RBAC funding_claims SELECT" ON public.funding_claims;
CREATE POLICY "RBAC funding_claims SELECT" ON public.funding_claims 
FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('funding') IN ('full', 'read_only') OR
    (public.jwt_get_perm('funding') = 'context_read_only' AND EXISTS (
        SELECT 1 FROM public.participant_funding pf 
        WHERE pf.id = funding_id AND public.jwt_has_house(pf.house_id)
    ))
);

DROP POLICY IF EXISTS "RBAC funding_claims ALL" ON public.funding_claims;
CREATE POLICY "RBAC funding_claims ALL" ON public.funding_claims 
FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('funding') = 'full' OR
    (public.jwt_get_perm('funding') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM public.participant_funding pf 
        WHERE pf.id = funding_id AND public.jwt_has_house(pf.house_id)
    ))
);

DROP POLICY IF EXISTS "RBAC funding_invoices SELECT" ON public.funding_invoices;
CREATE POLICY "RBAC funding_invoices SELECT" ON public.funding_invoices 
FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('funding') IN ('full', 'read_only') OR
    (public.jwt_get_perm('funding') = 'context_read_only' AND EXISTS (
        SELECT 1 FROM public.participant_funding pf 
        WHERE pf.id = funding_id AND public.jwt_has_house(pf.house_id)
    ))
);

DROP POLICY IF EXISTS "RBAC funding_invoices ALL" ON public.funding_invoices;
CREATE POLICY "RBAC funding_invoices ALL" ON public.funding_invoices 
FOR ALL TO authenticated 
USING (
    public.jwt_is_admin() OR 
    public.jwt_get_perm('funding') = 'full' OR
    (public.jwt_get_perm('funding') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM public.participant_funding pf 
        WHERE pf.id = funding_id AND public.jwt_has_house(pf.house_id)
    ))
);

-- 6. Storage Isolation Hardening
-- Map the submission_id in the path to its house_id
DROP POLICY IF EXISTS "RBAC storage_objects SELECT" ON storage.objects;
CREATE POLICY "RBAC storage_objects SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    public.jwt_is_admin() OR 
    bucket_id = 'public' OR 
    bucket_id = 'staff-photos' OR 
    bucket_id = 'participant-photos' OR 
    (bucket_id = 'checklist-attachments' AND EXISTS (
        -- Path structure in app: "[submission_id]/[item_id]/file.ext"
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id::text = split_part(name, '/', 1)
        AND public.jwt_has_house(hcs.house_id)
    ))
);

-- Storage Hardening & Operational RLS (2026-05-18)

-- 1. Cleanup existing storage policies
DROP POLICY IF EXISTS "RBAC storage_objects ALL" ON storage.objects;
DROP POLICY IF EXISTS "RBAC storage_objects INSERT (Staff)" ON storage.objects;
DROP POLICY IF EXISTS "RBAC storage_objects SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC storage_objects ALL (Admin)" ON storage.objects;
DROP POLICY IF EXISTS "RBAC checklist_attachments SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC checklist_attachments INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC staff_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC house_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC house_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participants_bucket SELECT" ON storage.objects;

-- 2. Global Admin Policy
CREATE POLICY "RBAC storage_objects ALL (Admin)" ON storage.objects 
FOR ALL TO authenticated 
USING (public.jwt_is_admin());

-- 3. Bucket: checklist-attachments
-- Path structure: "[submission_id]/[item_id]/file.ext"
CREATE POLICY "RBAC checklist_attachments SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'checklist-attachments' AND EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id::text = split_part(name, '/', 1)
        AND public.jwt_has_house(hcs.house_id)
    )
);

CREATE POLICY "RBAC checklist_attachments INSERT" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'checklist-attachments' AND EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id::text = split_part(name, '/', 1)
        AND public.jwt_has_house(hcs.house_id)
        AND public.jwt_get_perm('house_checklists') IN ('full', 'context_read_write')
    )
);

-- 4. Bucket: participant-documents
CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'participant-documents' AND EXISTS (
        SELECT 1 FROM public.participants p
        -- Data-Link Standard: Explicit match with database record
        WHERE (p.photo_url = name OR p.photo_url LIKE '%' || name)
        AND public.jwt_has_house(p.house_id)
    )
);

CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'participant-documents' AND EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.id::text = split_part(name, '/', 1)
        AND public.jwt_has_house(p.house_id)
        AND public.jwt_get_perm('participants') IN ('full', 'context_read_write')
    )
);

-- 5. Bucket: staff-documents
CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'staff-documents' AND (
        -- Global Access (HR/Admin)
        public.jwt_is_admin() OR
        public.jwt_get_perm('employees') IN ('full', 'read_only') OR
        -- Data-Link Access: Explicit match with database record (Handles Self & Colleagues)
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE (s.photo_url = name OR s.photo_url LIKE '%' || name)
            AND (
                s.auth_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = s.id AND public.jwt_has_house(hsa.house_id)
                )
            )
        )
    )
);

CREATE POLICY "RBAC staff_documents INSERT" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'staff-documents' AND (
        -- Self upload (UUID folder)
        split_part(name, '/', 1) = public.jwt_get_staff_id()::text OR
        -- HR upload
        public.jwt_get_perm('employees') = 'full'
    )
);

-- 6. Bucket: house-documents
-- Path structure: "[house_id]/..."
CREATE POLICY "RBAC house_documents SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'house-documents' AND public.jwt_has_house(split_part(name, '/', 1)::uuid)
);

CREATE POLICY "RBAC house_documents INSERT" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'house-documents' AND 
    public.jwt_has_house(split_part(name, '/', 1)::uuid) AND
    public.jwt_get_perm('houses') IN ('full', 'context_read_write')
);

-- 7. Bucket: branch-documents
-- Path structure: "[branch_id]/..."
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'branch-documents' AND EXISTS (
        -- Assigned to any house in this branch
        SELECT 1 FROM public.houses h
        WHERE h.branch_id::text = split_part(name, '/', 1)
        AND public.jwt_has_house(h.id)
    )
);

-- 8. Bucket: participants (Alias/Legacy)
CREATE POLICY "RBAC participants_bucket SELECT" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'participants' AND EXISTS (
        SELECT 1 FROM public.participants p
        -- Data-Link Standard: Explicit match with database record
        WHERE (p.photo_url = name OR p.photo_url LIKE '%' || name)
        AND public.jwt_has_house(p.house_id)
    )
);

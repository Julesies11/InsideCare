-- Migration: Fix Storage Path Parsing and Avatar Separation
-- Date: 2026-05-19
-- Description: Corrects RLS policies that incorrectly referenced entity names instead of file paths.
-- Also establishes dedicated buckets for Participant and Staff avatars.

-- 1. CLEANUP OLD/REDUNDANT POLICIES
DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participants_bucket SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC staff_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC house_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC house_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC checklist_attachments INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC checklist_attachments SELECT" ON storage.objects;

-- 2. BRANCH DOCUMENTS
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'branch-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM houses h 
            WHERE h.branch_id::text = split_part(name, '/', 1) 
            AND jwt_has_house(h.id)
        )
    )
);

-- 3. CHECKLIST ATTACHMENTS
CREATE POLICY "RBAC checklist_attachments INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'checklist-attachments' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM house_checklist_submissions hcs 
            WHERE hcs.id::text = split_part(name, '/', 1) 
            AND jwt_has_house(hcs.house_id) 
            AND jwt_get_perm('house_checklists') IN ('full', 'context_read_write')
        )
    )
);

CREATE POLICY "RBAC checklist_attachments SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'checklist-attachments' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM house_checklist_submissions hcs 
            WHERE hcs.id::text = split_part(name, '/', 1) 
            AND jwt_has_house(hcs.house_id)
        )
    )
);

-- 4. HOUSE DOCUMENTS
CREATE POLICY "RBAC house_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'house-documents' AND (
        jwt_is_admin() OR (
            jwt_has_house(split_part(name, '/', 1)::uuid) AND 
            jwt_get_perm('houses') IN ('full', 'context_read_write')
        )
    )
);

CREATE POLICY "RBAC house_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'house-documents' AND (
        jwt_is_admin() OR 
        jwt_has_house(split_part(name, '/', 1)::uuid) OR
        jwt_get_perm('houses') IN ('full', 'read_only')
    )
);

-- 5. PARTICIPANT DOCUMENTS (Clinical/Sensitive)
CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(name, '/', 1) 
            AND jwt_has_house(p.house_id) 
            AND jwt_get_perm('participants') IN ('full', 'context_read_write')
        )
    )
);

CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(name, '/', 1) 
            AND (jwt_has_house(p.house_id) OR jwt_get_perm('participants') IN ('full', 'read_only'))
        )
    )
);

-- 6. STAFF DOCUMENTS (Employment/Sensitive)
CREATE POLICY "RBAC staff_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'staff-documents' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') = 'full'
    )
);

CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-documents' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR 
        jwt_manages_staff(split_part(name, '/', 1)::uuid)
    )
);

-- 7. AVATAR BUCKETS (Separate from Documents)

-- participant-photos (Avatars)
DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-photos' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(name, '/', 1) 
            AND (jwt_has_house(p.house_id) OR jwt_get_perm('participants') IN ('full', 'read_only', 'context_read_only'))
        )
    )
);

DROP POLICY IF EXISTS "RBAC participant_photos INSERT" ON storage.objects;
CREATE POLICY "RBAC participant_photos INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'participant-photos' AND (
        jwt_is_admin() OR 
        jwt_get_perm('participants') IN ('full', 'context_read_write')
    )
);

-- staff-photos (Avatars)
DROP POLICY IF EXISTS "RBAC staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-photos' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR 
        EXISTS (
            SELECT 1 FROM house_staff_assignments hsa 
            WHERE hsa.staff_id::text = split_part(name, '/', 1) 
            AND jwt_has_house(hsa.house_id)
        )
    )
);

DROP POLICY IF EXISTS "RBAC staff_photos INSERT" ON storage.objects;
CREATE POLICY "RBAC staff_photos INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'staff-photos' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') = 'full'
    )
);

-- Migration: Fix Storage Bucket Names and RLS (Final)
-- Date: 2026-05-25
-- Description: Standardizes all storage buckets to use underscores and provides robust RLS for staff/participant documents.

-- 1. Ensure Standard Underscore Buckets Exist
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_branch_documents', 'ic_branch_documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_checklist_attachments', 'ic_checklist_attachments', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_house_documents', 'ic_house_documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_participant_documents', 'ic_participant_documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_participant_photos', 'ic_participant_photos', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_staff_documents', 'ic_staff_documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_staff_photos', 'ic_staff_photos', false) ON CONFLICT DO NOTHING;

-- 2. STAFF DOCUMENTS: Policies
DROP POLICY IF EXISTS "RBAC staff_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC staff_documents INSERT" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'ic_staff_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('employees') = 'full' OR
        split_part(name, '/', 1) = ic_jwt_get_staff_id()::text OR
        (split_part(name, '/', 1) = 'leave-attachments' AND split_part(name, '/', 2) = ic_jwt_get_staff_id()::text)
    )
);

DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_documents SELECT" 
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'ic_staff_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('employees') IN ('full', 'read_only') OR
        split_part(name, '/', 1) = ic_jwt_get_staff_id()::text OR
        (split_part(name, '/', 1) = 'leave-attachments' AND split_part(name, '/', 2) = ic_jwt_get_staff_id()::text) OR
        (ic_jwt_get_perm('employees') IN ('context_read_write', 'context_read_only') AND EXISTS (
            SELECT 1 FROM ic_staff s WHERE s.id::text = split_part(name, '/', 1) AND ic_jwt_manages_staff(s.id)
        ))
    )
);

-- 3. PARTICIPANT DOCUMENTS: Policies
DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC participant_documents INSERT" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'ic_participant_documents' AND (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('participants') IN ('full', 'context_read_write') AND EXISTS (
            SELECT 1 FROM ic_participants p WHERE p.id::text = split_part(name, '/', 1) AND ic_jwt_has_house(p.house_id)
        ))
    )
);

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_documents SELECT" 
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'ic_participant_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('participants') IN ('full', 'read_only') OR
        (ic_jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND EXISTS (
            SELECT 1 FROM ic_participants p WHERE p.id::text = split_part(name, '/', 1) AND ic_jwt_has_house(p.house_id)
        ))
    )
);

-- 4. PHOTOS & ATTACHMENTS: Policies (Sync to Underscore)
DROP POLICY IF EXISTS "RBAC participant_photos INSERT" ON storage.objects;
CREATE POLICY "RBAC participant_photos INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'ic_participant_photos' AND (ic_jwt_is_admin() OR ic_jwt_get_perm('participants') IN ('full', 'context_read_write')));

DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'ic_participant_photos' AND (ic_jwt_is_admin() OR ic_jwt_get_perm('participants') IN ('full', 'read_only') OR (ic_jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM ic_participants p WHERE p.id::text = split_part(name, '/', 1) AND ic_jwt_has_house(p.house_id)))));

DROP POLICY IF EXISTS "RBAC staff_photos INSERT" ON storage.objects;
CREATE POLICY "RBAC staff_photos INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'ic_staff_photos' AND (ic_jwt_is_admin() OR split_part(name, '/', 1) = ic_jwt_get_staff_id()::text));

DROP POLICY IF EXISTS "RBAC staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'ic_staff_photos' AND (ic_jwt_is_admin() OR split_part(name, '/', 1) = ic_jwt_get_staff_id()::text OR (ic_jwt_get_perm('employees') IN ('context_read_write', 'context_read_only') AND EXISTS (SELECT 1 FROM ic_staff s WHERE s.id::text = split_part(name, '/', 1) AND ic_jwt_manages_staff(s.id)))));

DROP POLICY IF EXISTS "RBAC checklist_attachments INSERT" ON storage.objects;
CREATE POLICY "RBAC checklist_attachments INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'ic_checklist_attachments' AND (ic_jwt_is_admin() OR ic_jwt_get_perm('house_checklists') IN ('full', 'context_read_write')));

-- 5. HOUSE & BRANCH: Policies
DROP POLICY IF EXISTS "RBAC house_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC house_documents INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'ic_house_documents' AND (ic_jwt_is_admin() OR (ic_jwt_has_house(split_part(name, '/', 1)::uuid) AND ic_jwt_get_perm('houses') IN ('full', 'context_read_write'))));

DROP POLICY IF EXISTS "RBAC house_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC house_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'ic_house_documents' AND (ic_jwt_is_admin() OR ic_jwt_has_house(split_part(name, '/', 1)::uuid) OR ic_jwt_get_perm('houses') IN ('full', 'read_only')));

DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'ic_branch_documents' AND (ic_jwt_is_admin() OR ic_jwt_get_perm('master_lists') IN ('full', 'read_only')));

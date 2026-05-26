-- Migration: Fix Postgres Column Ambiguity in Storage RLS
-- Date: 2026-05-19
-- Description: Explicitly qualifies the `name` column as `objects.name` to prevent Postgres from resolving it to the inner table's `name` column (e.g. `participants.name` or `houses.name`).

-- 1. BRANCH DOCUMENTS (Fix h.name ambiguity)
DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'branch-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM houses h 
            WHERE h.branch_id::text = split_part(objects.name, '/', 1) 
            AND jwt_has_house(h.id)
        )
    )
);

-- 2. PARTICIPANT DOCUMENTS (Fix p.name ambiguity)
DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(objects.name, '/', 1) 
            AND jwt_has_house(p.house_id) 
            AND jwt_get_perm('participants') IN ('full', 'context_read_write')
        )
    )
);

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(objects.name, '/', 1) 
            AND (jwt_has_house(p.house_id) OR jwt_get_perm('participants') IN ('full', 'read_only'))
        )
    )
);

-- 3. PARTICIPANT PHOTOS (Fix p.name ambiguity)
DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-photos' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(objects.name, '/', 1) 
            AND (jwt_has_house(p.house_id) OR jwt_get_perm('participants') IN ('full', 'read_only', 'context_read_only'))
        )
    )
);

-- 4. STAFF PHOTOS (Qualify for safety)
DROP POLICY IF EXISTS "RBAC staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-photos' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR 
        EXISTS (
            SELECT 1 FROM house_staff_assignments hsa 
            WHERE hsa.staff_id::text = split_part(objects.name, '/', 1) 
            AND jwt_has_house(hsa.house_id)
        )
    )
);


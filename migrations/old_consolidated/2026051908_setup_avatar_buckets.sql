-- Migration: Setup Avatar Buckets and Fix Storage Visibility
-- Date: 2026-05-19
-- Description: 
-- 1. Creates dedicated participant-photos and staff-photos buckets for avatars.
-- 2. Implements "Level-Guarded" SELECT policies for avatars to support Support Workers.
-- 3. Hardens document buckets to also support the 'context_read_only' level.

-- 1. CREATE AVATAR BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('participant-photos', 'participant-photos', false),
  ('staff-photos', 'staff-photos', false)
ON CONFLICT (id) DO NOTHING;


-- 2. PARTICIPANT AVATARS (SELECT)
DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-photos' AND (
        jwt_is_admin() OR 
        jwt_get_perm('participants') IN ('full', 'read_only') OR
        (jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND 
         EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(objects.name, '/', 1) 
            AND jwt_has_house(p.house_id)
         )
        )
    )
);

-- 3. STAFF AVATARS (SELECT)
DROP POLICY IF EXISTS "RBAC staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-photos' AND (
        jwt_is_admin() OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR
        split_part(objects.name, '/', 1) = jwt_get_staff_id()::text OR 
        (jwt_get_perm('employees') IN ('context_read_write', 'context_read_only') AND 
         EXISTS (
            SELECT 1 FROM house_staff_assignments hsa 
            WHERE hsa.staff_id::text = split_part(objects.name, '/', 1) 
            AND jwt_has_house(hsa.house_id)
         )
        )
    )
);


-- 4. HARDEN DOCUMENT BUCKETS (Support 'context_read_only')

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        jwt_get_perm('participants') IN ('full', 'read_only') OR
        (jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND 
         EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(objects.name, '/', 1) 
            AND jwt_has_house(p.house_id)
         )
        )
    )
);

DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-documents' AND (
        jwt_is_admin() OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR
        split_part(objects.name, '/', 1) = jwt_get_staff_id()::text OR 
        (jwt_get_perm('employees') IN ('context_read_write', 'context_read_only') AND 
         EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id::text = split_part(objects.name, '/', 1)
            AND jwt_manages_staff(s.id)
         )
        )
    )
);

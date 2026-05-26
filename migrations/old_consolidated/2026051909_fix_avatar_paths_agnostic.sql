-- Migration: Folder-Agnostic Avatar Visibility Fix
-- Date: 2026-05-19
-- Description: 
-- 1. Updates participant-photos and staff-photos SELECT policies to be folder-agnostic.
-- 2. Corrects the logic to match by EITHER UUID folder OR filename in photo_url column.
-- 3. Ensures Support Workers (context_read_only) can see faces in their assigned houses.

-- 1. FIX PARTICIPANT AVATARS
DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-photos' AND (
        jwt_is_admin() OR 
        jwt_get_perm('participants') IN ('full', 'read_only') OR
        -- Context Check: Works for both UUID folders AND flat filenames
        (jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND 
         EXISTS (
            SELECT 1 FROM participants p 
            WHERE (p.id::text = split_part(objects.name, '/', 1) OR p.photo_url ILIKE '%' || objects.name)
            AND jwt_has_house(p.house_id)
         )
        )
    )
);

-- 2. FIX STAFF AVATARS
DROP POLICY IF EXISTS "RBAC staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-photos' AND (
        jwt_is_admin() OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR
        split_part(objects.name, '/', 1) = jwt_get_staff_id()::text OR 
        -- Context Check: Works for coworkers in the same house
        (jwt_get_perm('employees') IN ('context_read_write', 'context_read_only') AND 
         EXISTS (
            SELECT 1 FROM house_staff_assignments hsa 
            JOIN staff s ON s.id = hsa.staff_id
            WHERE (hsa.staff_id::text = split_part(objects.name, '/', 1) OR s.photo_url ILIKE '%' || objects.name)
            AND jwt_has_house(hsa.house_id)
         )
        )
    )
);

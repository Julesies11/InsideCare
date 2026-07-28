-- Migration: Harden ic_house_documents storage policies for granular permissions
-- Description: Updates the storage policies for the ic_house_documents bucket to support users with the granular 'house_resources' permission.

BEGIN;

-- 1. Update INSERT policy for ic_house_documents
-- Allows users with either 'houses' or 'house_resources' write access to upload to their house's folder
DROP POLICY IF EXISTS "RBAC house_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC house_documents INSERT" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    (bucket_id = 'ic_house_documents'::text) AND (
        ic_jwt_is_admin() OR 
        (
            ic_jwt_has_house((split_part(name, '/'::text, 1))::uuid) AND (
                ic_jwt_get_perm('houses'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text]) OR
                ic_jwt_get_perm('house_resources'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text])
            )
        )
    )
);

-- 2. Update SELECT policy for ic_house_documents
-- Allows users with either 'houses' or 'house_resources' read access to view files in their house's folder
DROP POLICY IF EXISTS "RBAC house_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC house_documents SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    (bucket_id = 'ic_house_documents'::text) AND (
        ic_jwt_is_admin() OR 
        ic_jwt_has_house((split_part(name, '/'::text, 1))::uuid) OR 
        (ic_jwt_get_perm('houses'::text) = ANY (ARRAY['full'::text, 'read_only'::text, 'context_read_write'::text, 'context_read_only'::text])) OR
        (ic_jwt_get_perm('house_resources'::text) = ANY (ARRAY['full'::text, 'read_only'::text, 'context_read_write'::text, 'context_read_only'::text]))
    )
);

-- 3. Update ALL (DELETE/UPDATE) policy for ic_house_documents
-- Note: There wasn't a specific ALL policy for house_documents in storage_schema.json besides Admin, 
-- but let's ensure full access users can manage their files.
DROP POLICY IF EXISTS "RBAC house_documents ALL" ON storage.objects;
CREATE POLICY "RBAC house_documents ALL" ON storage.objects FOR ALL TO authenticated USING (
    (bucket_id = 'ic_house_documents'::text) AND (
        ic_jwt_is_admin() OR 
        (
            ic_jwt_has_house((split_part(name, '/'::text, 1))::uuid) AND (
                ic_jwt_get_perm('houses'::text) = 'full'::text OR
                ic_jwt_get_perm('house_resources'::text) = 'full'::text
            )
        )
    )
);

COMMIT;

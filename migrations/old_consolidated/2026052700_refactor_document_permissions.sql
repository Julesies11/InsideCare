-- Migration: Refactor Document Permissions (Override > Baseline)
-- Date: 2026-05-27
-- Description: Removes is_restricted binary toggle and implements granular role-level overrides.

BEGIN;

-- 1. Drop existing policies that depend on is_restricted
DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON public.ic_participant_documents;
DROP POLICY IF EXISTS "RBAC participant_documents ALL" ON public.ic_participant_documents;

-- 2. Remove is_restricted column from ic_participant_documents
ALTER TABLE public.ic_participant_documents DROP COLUMN IF EXISTS is_restricted;

-- 3. Update RLS Policies for ic_participant_documents
-- Access logic:
-- a) User is Admin -> Full Access
-- b) EffectiveLevel = Override (if exists) OR Global Baseline
-- c) If EffectiveLevel is 'full' or 'read_only', grant SELECT access.
-- d) If EffectiveLevel is 'context_read_write' or 'context_read_only', grant SELECT access ONLY IF user is assigned to the participant's house.
-- e) ALL access (INSERT, UPDATE, DELETE) requires 'full' or 'context_read_write' EffectiveLevel.

CREATE POLICY "RBAC participant_documents SELECT" ON public.ic_participant_documents FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_participant_document_roles pdr 
             WHERE pdr.document_id = ic_participant_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('participant_documents')
        ) IN ('full', 'read_only')
    ) OR
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_participant_document_roles pdr 
             WHERE pdr.document_id = ic_participant_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('participant_documents')
        ) IN ('context_read_write', 'context_read_only')
        AND
        EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
    )
);

CREATE POLICY "RBAC participant_documents ALL" ON public.ic_participant_documents FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_participant_document_roles pdr 
             WHERE pdr.document_id = ic_participant_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('participant_documents')
        ) = 'full'
    ) OR
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_participant_document_roles pdr 
             WHERE pdr.document_id = ic_participant_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('participant_documents')
        ) = 'context_read_write'
        AND
        EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
    )
);

-- 3. Update Storage RLS for ic_participant_documents bucket
-- For downloading files, just rely on the table's SELECT policy for security.
DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'ic_participant_documents' AND (
        ic_jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.ic_participant_documents doc
            WHERE doc.file_path = name
        )
    )
);

COMMIT;

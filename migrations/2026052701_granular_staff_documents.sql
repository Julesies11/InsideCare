-- Migration: Granular Staff Document Permissions
-- Date: 2026-05-27
-- Description: Creates ic_staff_document_roles, removes is_restricted, and implements granular overrides.

BEGIN;

-- 1. Create junction table for role-based document permissions
CREATE TABLE IF NOT EXISTS public.ic_staff_document_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES public.ic_staff_documents(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.ic_roles(id) ON DELETE CASCADE,
    access_level public.ic_access_level_enum NOT NULL DEFAULT 'read_only'::public.ic_access_level_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    UNIQUE (document_id, role_id)
);

ALTER TABLE public.ic_staff_document_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies that depend on is_restricted
DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON public.ic_staff_documents;
DROP POLICY IF EXISTS "RBAC staff_documents ALL" ON public.ic_staff_documents;

-- 3. Remove is_restricted column from ic_staff_documents
ALTER TABLE public.ic_staff_documents DROP COLUMN IF EXISTS is_restricted;

-- 4. Update RLS Policies for ic_staff_documents
-- Access logic:
-- a) User is Admin -> Full Access
-- b) EffectiveLevel = Override (if exists) OR Global Baseline
-- c) If EffectiveLevel is 'full' or 'read_only', grant SELECT access.
-- d) If EffectiveLevel is 'context_read_write' or 'context_read_only', grant SELECT access ONLY IF user manages the staff member.
-- e) ALL access (INSERT, UPDATE, DELETE) requires 'full' or 'context_read_write' EffectiveLevel.

CREATE POLICY "RBAC staff_documents SELECT" ON public.ic_staff_documents FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_staff_document_roles pdr 
             WHERE pdr.document_id = ic_staff_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('staff_documents')
        ) IN ('full', 'read_only')
    ) OR
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_staff_document_roles pdr 
             WHERE pdr.document_id = ic_staff_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('staff_documents')
        ) IN ('context_read_write', 'context_read_only')
        AND
        ic_jwt_manages_staff(staff_id)
    ) OR
    -- Staff can see their own documents
    staff_id = ic_jwt_get_staff_id()
);

CREATE POLICY "RBAC staff_documents ALL" ON public.ic_staff_documents FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_staff_document_roles pdr 
             WHERE pdr.document_id = ic_staff_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('staff_documents')
        ) = 'full'
    ) OR
    (
        COALESCE(
            (SELECT access_level::text FROM public.ic_staff_document_roles pdr 
             WHERE pdr.document_id = ic_staff_documents.id AND pdr.role_id = ic_jwt_get_role_id()),
            ic_jwt_get_perm('staff_documents')
        ) = 'context_read_write'
        AND
        ic_jwt_manages_staff(staff_id)
    ) OR
    -- Staff can edit/delete their own documents
    staff_id = ic_jwt_get_staff_id()
);

-- RLS for the roles mapping table
CREATE POLICY "RBAC doc_roles SELECT" ON public.ic_staff_document_roles FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_documents') = 'full' OR
    role_id = ic_jwt_get_role_id()
);

CREATE POLICY "RBAC doc_roles ALL" ON public.ic_staff_document_roles FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_documents') = 'full'
);

-- 5. Update Storage RLS for ic_staff_documents bucket
-- For downloading files, just rely on the table's SELECT policy for security.
DROP POLICY IF EXISTS "RBAC storage staff_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC storage staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'ic_staff_documents' AND (
        ic_jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.ic_staff_documents doc
            WHERE doc.file_path = name
        )
    )
);

-- Update ALL policy to secure uploads
DROP POLICY IF EXISTS "RBAC storage staff_documents ALL" ON storage.objects;
CREATE POLICY "RBAC storage staff_documents ALL" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'ic_staff_documents' AND (
        ic_jwt_is_admin() OR
        ic_jwt_get_perm('staff_documents') = 'full' OR
        (ic_jwt_get_perm('staff_documents') = 'context_read_write' AND ic_jwt_manages_staff((split_part(name, '/', 1))::uuid)) OR
        (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text)
    )
);

COMMIT;
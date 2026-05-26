-- Migration: Granular Participant Documents (Role-Based)
-- Date: 2026-05-26
-- Description: Adds role-based permission support for participant documents.

BEGIN;

-- 1. Create a table for role-based document permissions
-- This allows assigning specific access to Roles (e.g., House Manager, Supervisor).
CREATE TABLE IF NOT EXISTS public.ic_participant_document_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES public.ic_participant_documents(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.ic_roles(id) ON DELETE CASCADE,
    access_level public.ic_access_level_enum NOT NULL DEFAULT 'read_only'::public.ic_access_level_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    UNIQUE (document_id, role_id)
);

ALTER TABLE public.ic_participant_document_roles ENABLE ROW LEVEL SECURITY;

-- 2. Add helper function to get user's role_id from JWT
CREATE OR REPLACE FUNCTION public.ic_jwt_get_role_id() RETURNS uuid AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies for ic_participant_documents
-- Restricted documents are visible if:
-- a) User is Admin
-- b) User has FULL permission for participant_documents
-- c) User's Role has an explicit entry in ic_participant_document_roles

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON public.ic_participant_documents;
CREATE POLICY "RBAC participant_documents SELECT" ON public.ic_participant_documents FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    (
        -- Standard access check
        (
            ic_jwt_get_perm('participant_documents') IN ('full', 'read_only') OR 
            ((ic_jwt_get_perm('participant_documents') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
        )
        AND
        -- Privacy check: restricted documents require FULL permission OR Role assignment
        (
            NOT is_restricted OR 
            ic_jwt_get_perm('participant_documents') = 'full' OR
            EXISTS (
                SELECT 1 FROM public.ic_participant_document_roles pdr
                WHERE pdr.document_id = ic_participant_documents.id 
                AND pdr.role_id = ic_jwt_get_role_id()
            )
        )
    )
);

-- Update ALL policy
DROP POLICY IF EXISTS "RBAC participant_documents ALL" ON public.ic_participant_documents;
CREATE POLICY "RBAC participant_documents ALL" ON public.ic_participant_documents FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_documents') = 'full' OR 
    (
        (ic_jwt_get_perm('participant_documents') = 'context_read_write') AND 
        (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))) AND
        (
            NOT is_restricted OR
            EXISTS (
                SELECT 1 FROM public.ic_participant_document_roles pdr
                WHERE pdr.document_id = ic_participant_documents.id 
                AND pdr.role_id = ic_jwt_get_role_id()
                AND pdr.access_level = 'context_read_write'
            )
        )
    )
);

-- RLS for the roles mapping table
CREATE POLICY "RBAC doc_roles SELECT" ON public.ic_participant_document_roles FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_documents') = 'full' OR
    role_id = ic_jwt_get_role_id()
);

CREATE POLICY "RBAC doc_roles ALL" ON public.ic_participant_document_roles FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_documents') = 'full'
);

COMMIT;

-- Migration: Fix corrupted Storage RLS policies
-- Description: Corrects errors in storage.objects policies where 'name' was incorrectly prefixed with table aliases.

BEGIN;

-- 1. DROP corrupted storage policies
DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participant_photos SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;

-- 2. RECREATE storage policies with correct 'name' references
-- Note: 'name' refers to the 'name' column in the 'storage.objects' table itself.

CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_branch-documents') AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_houses h WHERE (((h.branch_id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(h.id))))));

CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_participant-documents') AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE (((p.id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(p.house_id) AND (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'context_read_write'])))))));

CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_participant-photos') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('participants') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((((p.id)::text = split_part(name, '/', 1)) OR (p.photo_url ~~* ('%' || name))) AND ic_jwt_has_house(p.house_id)))))));

CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_staff-documents') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('employees') = ANY (ARRAY['full', 'read_only'])) OR (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text) OR ((ic_jwt_get_perm('employees') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM public.ic_staff s WHERE (((s.id)::text = split_part(name, '/', 1)) AND ic_jwt_manages_staff(s.id)))))));

CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_participant-documents') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('participants') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE (((p.id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(p.house_id)))))));

COMMIT;

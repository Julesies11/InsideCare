-- Migration: Fix missing INSERT/UPDATE policies for ic_contact_types_master
BEGIN;

DROP POLICY IF EXISTS "RBAC contact_types_master INSERT" ON public.ic_contact_types_master;
CREATE POLICY "RBAC contact_types_master INSERT" ON public.ic_contact_types_master
  FOR INSERT TO authenticated WITH CHECK (ic_jwt_is_admin());

DROP POLICY IF EXISTS "RBAC contact_types_master UPDATE" ON public.ic_contact_types_master;
CREATE POLICY "RBAC contact_types_master UPDATE" ON public.ic_contact_types_master
  FOR UPDATE TO authenticated USING (ic_jwt_is_admin());

COMMIT;

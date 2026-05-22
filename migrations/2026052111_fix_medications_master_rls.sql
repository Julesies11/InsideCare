-- Migration: Fix missing INSERT/UPDATE policies for ic_medications_master
BEGIN;

DROP POLICY IF EXISTS "RBAC medications_master INSERT" ON public.ic_medications_master;
CREATE POLICY "RBAC medications_master INSERT" ON public.ic_medications_master
  FOR INSERT TO authenticated WITH CHECK (ic_jwt_is_admin());

DROP POLICY IF EXISTS "RBAC medications_master UPDATE" ON public.ic_medications_master;
CREATE POLICY "RBAC medications_master UPDATE" ON public.ic_medications_master
  FOR UPDATE TO authenticated USING (ic_jwt_is_admin());

COMMIT;

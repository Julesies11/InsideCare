-- Migration: Fix missing INSERT/UPDATE policies for ic_checklist_master
BEGIN;

DROP POLICY IF EXISTS "RBAC checklist_master INSERT" ON public.ic_checklist_master;
CREATE POLICY "RBAC checklist_master INSERT" ON public.ic_checklist_master
  FOR INSERT TO authenticated WITH CHECK (ic_jwt_is_admin());

DROP POLICY IF EXISTS "RBAC checklist_master UPDATE" ON public.ic_checklist_master;
CREATE POLICY "RBAC checklist_master UPDATE" ON public.ic_checklist_master
  FOR UPDATE TO authenticated USING (ic_jwt_is_admin());

COMMIT;

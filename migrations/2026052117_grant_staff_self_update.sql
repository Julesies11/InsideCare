-- Migration: Grant staff self-update permissions on ic_staff
BEGIN;

DROP POLICY IF EXISTS "RBAC ic_staff SELF UPDATE" ON public.ic_staff;
CREATE POLICY "RBAC ic_staff SELF UPDATE" ON public.ic_staff
  FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());

COMMIT;

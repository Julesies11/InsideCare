-- ========================================================================================
-- RBAC HARDENING 2026-05-13
-- Objective: Automate permission record creation and handle role deletions.
-- ========================================================================================

-- 1. AUTOMATIC PERMISSION RECORD CREATION
-- This trigger ensures that every new role created automatically gets a 
-- default record in the role_permissions table (defaulting to 'none').
CREATE OR REPLACE FUNCTION public.handle_new_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.role_permissions (role_id)
    VALUES (NEW.id)
    ON CONFLICT (role_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_new_role_permissions ON public.roles;
CREATE TRIGGER trigger_handle_new_role_permissions
AFTER INSERT ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_role_permissions();

-- 2. ENSURE CONSISTENT ROLE CLEANUP
-- This ensures that if a role is deleted, we update the metadata of any staff
-- who were previously assigned to it (though FK constraints might block deletion if staff exist).
CREATE OR REPLACE FUNCTION public.handle_role_deletion_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- We don't delete staff, we just clear their metadata or re-sync
  FOR v_staff_id IN SELECT id FROM public.staff WHERE role_id = OLD.id LOOP
    -- Re-syncing will now find no role and thus no permissions
    PERFORM public.sync_staff_role_to_metadata_for_staff(v_staff_id);
  END LOOP;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_role_deletion_sync ON public.roles;
CREATE TRIGGER trigger_handle_role_deletion_sync
BEFORE DELETE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_role_deletion_sync();

-- 3. ENSURE ALL ROLES CURRENTLY HAVE PERMISSION RECORDS
INSERT INTO public.role_permissions (role_id)
SELECT id FROM public.roles
ON CONFLICT (role_id) DO NOTHING;

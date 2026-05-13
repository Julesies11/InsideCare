-- ========================================================================================
-- GRANULAR ADMIN ROLES 2026-05-11
-- Objective: Transition from binary is_admin to tiered roles:
-- 1. Management/Director: Full System Access (CRUD)
-- 2. Finance: Read-Only Access (Global)
-- 3. Supervisor: Read-Only Access (Global) + House Profile Management (CRUD)
-- ========================================================================================

-- 1. ENSURE UNIQUE ROLE NAMES
ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);

-- 2. SEED ADMIN ROLES
INSERT INTO public.roles (name, description, is_active)
VALUES 
  ('Management', 'Full administrative access to all system features.', true),
  ('Director', 'Executive level access with full system control.', true),
  ('Finance', 'Read-only access to all records for financial auditing.', true),
  ('Supervisor', 'Global read access with ability to manage house profiles.', true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 3. DROP LEGACY ADMIN POLICIES
-- We remove the blanket "is_admin" policies to replace them with role-aware versions.
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Public schema policies
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND policyname = 'Admins full access') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
    
    -- Storage schema policies
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Admins full storage access') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 4. APPLY GRANULAR ADMIN POLICIES
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Tier 1: Management / Director / Super-Admin (is_admin = true)
        -- Full CRUD access to everything.
        EXECUTE format('CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated 
          USING (
            (auth.jwt() -> ''user_metadata'' ->> ''is_admin'')::boolean = true OR 
            (auth.jwt() -> ''user_metadata'' ->> ''role_name'') IN (''Management'', ''Director'')
          )', t.tablename);

        -- Tier 2: Finance / Supervisor
        -- Global Read access to everything.
        EXECUTE format('CREATE POLICY "Admins read-only access" ON public.%I FOR SELECT TO authenticated 
          USING (
            (auth.jwt() -> ''user_metadata'' ->> ''role_name'') IN (''Finance'', ''Supervisor'')
          )', t.tablename);
    END LOOP;
END $$;

-- 5. SPECIFIC SUPERVISOR HOUSE ACCESS
-- Supervisors have full control (CRUD) over houses, even though they are read-only elsewhere.
-- Note: SELECT is already covered by the global read-only policy above.
CREATE POLICY "Supervisors can manage houses" ON public.houses 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role_name') = 'Supervisor')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role_name') = 'Supervisor');

-- 6. STORAGE SECURITY UPDATES
CREATE POLICY "Admins full storage access" ON storage.objects FOR ALL TO authenticated 
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
    (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Management', 'Director')
  );

CREATE POLICY "Admins read-only storage access" ON storage.objects FOR SELECT TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Finance', 'Supervisor'));

-- 7. AUTOMATIC ROLE SYNC TO JWT METADATA
-- This function ensures that when a staff member's role is updated in the database,
-- their secure JWT metadata is automatically updated to reflect the change.
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  -- Look up the name of the new role
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  -- Update the auth.users metadata if the staff record is linked to an auth user
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role_name', v_role_name)
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_staff_role_to_metadata ON public.staff;
CREATE TRIGGER trigger_sync_staff_role_to_metadata
AFTER INSERT OR UPDATE OF role_id ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.sync_staff_role_to_metadata();

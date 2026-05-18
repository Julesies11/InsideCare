-- ========================================================================================
-- RBAC HYBRID RESILIENCE (RECOVERY MIGRATION)
-- Date: 2026-05-18
-- Objective: Add DB fallbacks to JWT helpers and cleanup conflicting legacy policies.
-- ========================================================================================

BEGIN;

-- 1. CLEANUP REMAINING NON-STANDARD POLICIES
-- These may have been missed by the previous drop loop.
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename, schemaname
    FROM pg_policies 
    WHERE (schemaname = 'public' OR schemaname = 'storage')
    AND (
      policyname IN (
        'Admins manage role permissions',
        'Staff can view own documents',
        'Staff can view own compliance',
        'Staff can view own training',
        'Enable read access for all users',
        'Allow authenticated users to read everything'
      )
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;


-- 2. UPGRADE HELPERS WITH DATABASE FALLBACKS
-- This ensures that during metadata transitions, users are not locked out.

CREATE OR REPLACE FUNCTION public.jwt_is_admin() 
RETURNS boolean AS $$
BEGIN
  -- 1. Check app_metadata (Fastest)
  IF (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true THEN
    RETURN true;
  END IF;

  -- 2. Check user_metadata (Supabase defaults/stale claims)
  IF (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true THEN
    RETURN true;
  END IF;

  -- 3. Fallback to Database (Reliable during transition)
  IF EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.roles r ON s.role_id = r.id
    WHERE s.auth_user_id = auth.uid()
    AND (r.name IN ('Admin', 'Director', 'Management') OR (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Admin', 'Director', 'Management'))
    AND s.status = 'active'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_get_staff_id() 
RETURNS uuid AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- 1. Check JWT
  v_staff_id := (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
  IF v_staff_id IS NOT NULL THEN
    RETURN v_staff_id;
  END IF;

  -- 2. Fallback to Database
  SELECT id INTO v_staff_id FROM public.staff WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_has_house(p_house_id uuid) 
RETURNS boolean AS $$
BEGIN
  -- 1. Check JWT (JSONB containment)
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;

  -- 2. Fallback to Database
  IF EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa
    JOIN public.staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
    AND hsa.house_id = p_house_id
    AND (hsa.end_date IS NULL OR hsa.end_date > now())
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_manages_staff(p_staff_id uuid) 
RETURNS boolean AS $$
BEGIN
  -- 1. Check JWT
  IF (auth.jwt() -> 'app_metadata' -> 'managed_staff_ids') @> jsonb_build_array(p_staff_id::text) THEN
    RETURN true;
  END IF;

  -- 2. Fallback to Database
  IF EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = (SELECT manager_id FROM public.staff WHERE id = p_staff_id)
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.jwt_get_perm(p_module text) 
RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- 1. Check JWT (Fastest)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- 2. Fallback to Database (Reliable)
  -- Uses correct column names from 2026051703_rbac_reset_and_rebuild.sql
  SELECT 
    CASE p_module
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      WHEN 'participants' THEN participants::text
      WHEN 'shift_notes' THEN shift_notes::text
      WHEN 'employees' THEN employees::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      WHEN 'roster_board' THEN roster_board::text
      WHEN 'houses' THEN houses::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.role_permissions rp
  JOIN public.staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMIT;

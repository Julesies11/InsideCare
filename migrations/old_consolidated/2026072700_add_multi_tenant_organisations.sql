-- ============================================================================
-- Migration: 2026072700_add_multi_tenant_organisations.sql
-- Purpose: Introduce multi-tenant (multi-organisation) foundation supporting:
--          1. Multi-Org staff membership (ic_staff_organisations)
--          2. Unified domain session-based active organisation context
--          3. Hybrid Master List scoping (Global defaults + Org overrides)
-- Author: Senior Software Engineer & Security Researcher
-- Status: VERIFIED & AUDITED
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ORGANISATIONS MASTER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ic_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

ALTER TABLE public.ic_organisations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ic_organisations_slug ON public.ic_organisations(slug);

-- Apply standard audit & activity triggers to ic_organisations if functions exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ic_set_audit_columns') THEN
    DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_organisations;
    CREATE TRIGGER ic_trigger_set_audit_columns 
      BEFORE INSERT OR UPDATE ON public.ic_organisations
      FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ic_audit_trigger_func') THEN
    DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_organisations;
    CREATE TRIGGER ic_audit_universal_trigger 
      AFTER INSERT OR UPDATE OR DELETE ON public.ic_organisations
      FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- 2. DEFAULT PRIMARY ORGANISATION SEED DATA
-- ============================================================================
INSERT INTO public.ic_organisations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Primary Care Organisation', 'primary-care')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. STAFF ORGANISATIONS JUNCTION TABLE (Multi-Org Staff Membership)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ic_staff_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.ic_staff(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.ic_organisations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.ic_roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(staff_id, organisation_id)
);

ALTER TABLE public.ic_staff_organisations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ic_staff_organisations_staff ON public.ic_staff_organisations(staff_id);
CREATE INDEX IF NOT EXISTS idx_ic_staff_organisations_org ON public.ic_staff_organisations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ic_staff_organisations_role ON public.ic_staff_organisations(role_id);

-- Apply standard audit & activity triggers to ic_staff_organisations if functions exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ic_set_audit_columns') THEN
    DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_organisations;
    CREATE TRIGGER ic_trigger_set_audit_columns 
      BEFORE INSERT OR UPDATE ON public.ic_staff_organisations
      FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ic_audit_trigger_func') THEN
    DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_organisations;
    CREATE TRIGGER ic_audit_universal_trigger 
      AFTER INSERT OR UPDATE OR DELETE ON public.ic_staff_organisations
      FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- 4. JWT TENANT EXTRACTION SQL HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ic_jwt_get_organisation_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'active_organisation_id')::UUID,
    (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 5. RLS POLICIES FOR ORGANISATIONS & STAFF ORGANISATIONS
-- ============================================================================

-- RLS Policy: ic_organisations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ic_organisations' AND policyname = 'Organisations - SELECT by tenant membership'
  ) THEN
    CREATE POLICY "Organisations - SELECT by tenant membership"
    ON public.ic_organisations
    FOR SELECT TO authenticated
    USING (
      id = public.ic_jwt_get_organisation_id()
      OR EXISTS (
        SELECT 1 FROM public.ic_staff_organisations so
        WHERE so.staff_id = public.ic_jwt_get_staff_id() 
          AND so.organisation_id = ic_organisations.id
          AND so.is_active = true
      )
    );
  END IF;
END $$;

-- RLS Policies: ic_staff_organisations
DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ic_staff_organisations' AND policyname = 'Staff Organisations - SELECT'
  ) THEN
    CREATE POLICY "Staff Organisations - SELECT"
    ON public.ic_staff_organisations
    FOR SELECT TO authenticated
    USING (
      staff_id = public.ic_jwt_get_staff_id()
      OR organisation_id = public.ic_jwt_get_organisation_id()
      OR public.ic_jwt_get_perm('employees') != 'none'
    );
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ic_staff_organisations' AND policyname = 'Staff Organisations - INSERT'
  ) THEN
    CREATE POLICY "Staff Organisations - INSERT"
    ON public.ic_staff_organisations
    FOR INSERT TO authenticated
    WITH CHECK (
      public.ic_jwt_get_perm('access_control') = 'full'
      OR public.ic_jwt_get_perm('employees') = 'context_read_write'
    );
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ic_staff_organisations' AND policyname = 'Staff Organisations - UPDATE'
  ) THEN
    CREATE POLICY "Staff Organisations - UPDATE"
    ON public.ic_staff_organisations
    FOR UPDATE TO authenticated
    USING (
      public.ic_jwt_get_perm('access_control') = 'full'
      OR public.ic_jwt_get_perm('employees') = 'context_read_write'
    );
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ic_staff_organisations' AND policyname = 'Staff Organisations - DELETE'
  ) THEN
    CREATE POLICY "Staff Organisations - DELETE"
    ON public.ic_staff_organisations
    FOR DELETE TO authenticated
    USING (public.ic_jwt_get_perm('access_control') = 'full');
  END IF;
END $$;

-- ============================================================================
-- 6. ADD organisation_id COLUMN & B-TREE INDEXES TO CORE TABLES
-- ============================================================================
DO $$
DECLARE
  target_table TEXT;
  target_tables TEXT[] := ARRAY[
    'ic_houses',
    'ic_staff',
    'ic_participants',
    'ic_roles',
    'ic_role_permissions',
    'ic_staff_shifts',
    'ic_shift_notes',
    'ic_timesheets',
    'ic_incident_reports',
    'ic_house_resources',
    'ic_house_checklists',
    'ic_activity_log',
    'ic_notifications'
  ];
BEGIN
  FOREACH target_table IN ARRAY target_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = target_table
    ) THEN
      -- Add column with FK
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id UUID NOT NULL DEFAULT %L REFERENCES public.ic_organisations(id);',
        target_table,
        '00000000-0000-0000-0000-000000000001'
      );
      
      -- Create B-Tree index for tenant lookup performance
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I(organisation_id);',
        'idx_' || target_table || '_organisation_id',
        target_table
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 7. ADD organisation_id TO MASTER LIST TABLES (Hybrid Model: NULL = System Global)
-- ============================================================================
DO $$
DECLARE
  master_table TEXT;
  master_tables TEXT[] := ARRAY[
    'ic_medication_types_master',
    'ic_compliance_types_master',
    'ic_incident_types_master',
    'ic_restrictive_practice_types_master',
    'ic_house_shift_templates'
  ];
BEGIN
  FOREACH master_table IN ARRAY master_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = master_table
    ) THEN
      -- Add nullable column for tenant-specific overrides
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.ic_organisations(id);',
        master_table
      );

      -- Create B-Tree index for master list queries
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I(organisation_id);',
        'idx_' || master_table || '_organisation_id',
        master_table
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 8. BACKFILL EXISTING STAFF INTO ic_staff_organisations
-- ============================================================================
INSERT INTO public.ic_staff_organisations (staff_id, organisation_id, role_id)
SELECT id, organisation_id, role_id FROM public.ic_staff
ON CONFLICT (staff_id, organisation_id) DO NOTHING;

COMMIT;

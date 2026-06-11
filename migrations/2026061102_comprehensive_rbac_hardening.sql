-- Migration: 2026061102_comprehensive_rbac_hardening.sql
-- Description: Consolidates all pending RBAC modules (staff_onboarding, admin_compliance, admin_onboarding), 
--              RLS hardening, and dynamic Audit/JWT function updates.
-- Author: Senior Engineer / Security Researcher
-- Status: VERIFIED (Comprehensive Consolidation)

BEGIN;

-- =============================================
-- 1. RBAC MODULE DEFINITIONS
-- =============================================

-- Add the columns to ic_role_permissions if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ic_role_permissions' AND column_name='staff_onboarding') THEN
        ALTER TABLE public.ic_role_permissions ADD COLUMN staff_onboarding public.ic_access_level_enum NOT NULL DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ic_role_permissions' AND column_name='admin_compliance') THEN
        ALTER TABLE public.ic_role_permissions ADD COLUMN admin_compliance public.ic_access_level_enum NOT NULL DEFAULT 'none';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ic_role_permissions' AND column_name='admin_onboarding') THEN
        ALTER TABLE public.ic_role_permissions ADD COLUMN admin_onboarding public.ic_access_level_enum NOT NULL DEFAULT 'none';
    END IF;
END $$;

-- Grant full access to Admin roles by default for the new modules
UPDATE public.ic_role_permissions 
SET staff_onboarding = 'full',
    admin_compliance = 'full', 
    admin_onboarding = 'full' 
WHERE access_control = 'full';

-- =============================================
-- 2. SECURITY DEFINER UPDATES (RBAC & AUDIT)
-- =============================================

-- Update ic_jwt_get_perm to include the new columns
-- Critical Fix: MUST RETURN text to match baseline schema and avoid dependency errors with existing RLS policies.
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text)
RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
  SELECT 
    CASE p_module
      -- Personal Modules (Staff Portal)
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      
      -- Care Management (Base and Granular)
      WHEN 'participants' THEN participants::text
      WHEN 'participant_goals' THEN participant_goals::text
      WHEN 'participant_behaviour' THEN participant_behaviour::text
      WHEN 'participant_support_needs' THEN participant_support_needs::text
      WHEN 'participant_mealtime' THEN participant_mealtime::text
      WHEN 'participant_medical_routine' THEN participant_medical_routine::text
      WHEN 'participant_clinical_trackers' THEN participant_clinical_trackers::text
      WHEN 'participant_medications' THEN participant_medications::text
      WHEN 'participant_emergency' THEN participant_emergency::text
      WHEN 'participant_contacts' THEN participant_contacts::text
      WHEN 'participant_documents' THEN participant_documents::text
      WHEN 'participant_shift_notes' THEN participant_shift_notes::text
      WHEN 'participant_activity_log' THEN participant_activity_log::text
      WHEN 'shift_notes' THEN shift_notes::text
      
      -- Employees & HR (Base and Granular)
      WHEN 'employees' THEN employees::text
      WHEN 'staff_employment' THEN staff_employment::text
      WHEN 'staff_availability' THEN staff_availability::text
      WHEN 'staff_emergency' THEN staff_emergency::text
      WHEN 'staff_compliance' THEN staff_compliance::text
      WHEN 'staff_onboarding' THEN staff_onboarding::text
      WHEN 'staff_training' THEN staff_training::text
      WHEN 'staff_documents' THEN staff_documents::text
      WHEN 'staff_roster' THEN staff_roster::text
      WHEN 'staff_leave' THEN staff_leave::text
      WHEN 'staff_warnings' THEN staff_warnings::text
      WHEN 'staff_activity_log' THEN staff_activity_log::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      
      -- Operations & Facilities (Base and Granular)
      WHEN 'houses' THEN houses::text
      WHEN 'house_management' THEN house_management::text
      WHEN 'house_operations' THEN house_operations::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'house_checklist_history' THEN house_checklist_history::text
      WHEN 'house_resources' THEN house_resources::text
      WHEN 'house_staff' THEN house_staff::text
      WHEN 'house_activity_log' THEN house_activity_log::text
      WHEN 'roster_board' THEN roster_board::text
      
      -- System Administration
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'admin_compliance' THEN admin_compliance::text
      WHEN 'admin_onboarding' THEN admin_onboarding::text
      WHEN 'activity_log' THEN activity_log::text
      WHEN 'incident_management' THEN incident_management::text
      
      -- Reporting
      WHEN 'reporting_clinical' THEN reporting_clinical::text
      WHEN 'reporting_operational' THEN reporting_operational::text
      WHEN 'reporting_compliance' THEN reporting_compliance::text
      
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions
  WHERE role_id = (
    SELECT role_id FROM public.ic_staff 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update ic_audit_trigger_func to resolve onboarding task names
CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func()
RETURNS trigger AS $$
DECLARE
    target_data JSONB;
    entity_name_val TEXT;
    user_name_val TEXT;
    acting_staff_id UUID;
BEGIN
    acting_staff_id := public.ic_jwt_get_staff_id();
    
    -- Resolve acting user name
    SELECT staff_name INTO user_name_val FROM public.ic_staff WHERE id = acting_staff_id LIMIT 1;
    
    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    -- Resolve Entity Name (Primary Check)
    entity_name_val := COALESCE(
        target_data->>'reference_id',
        target_data->>'file_name',
        target_data->>'staff_name', 
        target_data->>'participant_name',
        target_data->>'name'
    );

    -- Resolve names for ID-only records dynamically from master tables
    IF entity_name_val IS NULL THEN
        IF TG_TABLE_NAME = 'ic_staff_compliance' THEN
            SELECT compliance_name INTO entity_name_val FROM public.ic_compliance_types_master WHERE id = (target_data->>'compliance_type_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_staff_onboarding' THEN
            SELECT item_name INTO entity_name_val FROM public.ic_onboarding_items_master WHERE id = (target_data->>'onboarding_item_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_participant_medications' THEN
            SELECT medication_name INTO entity_name_val FROM public.ic_medications_master WHERE id = (target_data->>'medication_id')::uuid;
        END IF;
    END IF;

    -- Standard Audit Log Insertion
    INSERT INTO public.ic_activity_log (
        activity_type, entity_type, entity_id, entity_name, description, user_name, user_id
    ) VALUES (
        LOWER(TG_OP), REPLACE(TG_TABLE_NAME, 'ic_', ''), (target_data->>'id'), entity_name_val, 
        INITCAP(TG_OP) || ' ' || REPLACE(TG_TABLE_NAME, 'ic_', '') || ': ' || COALESCE(entity_name_val, 'ID ' || (target_data->>'id')),
        COALESCE(user_name_val, 'System'), acting_staff_id
    );

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. MASTER TABLE: Onboarding Items Master
-- =============================================
DROP POLICY IF EXISTS "Onboarding Items Select" ON public.ic_onboarding_items_master;
DROP POLICY IF EXISTS "Onboarding Items Admin ALL" ON public.ic_onboarding_items_master;
DROP POLICY IF EXISTS "Onboarding Items Insert" ON public.ic_onboarding_items_master;
DROP POLICY IF EXISTS "Onboarding Items Update" ON public.ic_onboarding_items_master;
DROP POLICY IF EXISTS "Onboarding Items Delete" ON public.ic_onboarding_items_master;

CREATE POLICY "Onboarding Items Select" ON public.ic_onboarding_items_master
    FOR SELECT TO authenticated
    USING (
        public.ic_jwt_is_admin() OR 
        public.ic_jwt_get_perm('admin_onboarding') != 'none' OR
        public.ic_jwt_get_perm('staff_onboarding') != 'none' OR
        public.ic_jwt_get_perm('employees') != 'none'
    );

CREATE POLICY "Onboarding Items Admin ALL" ON public.ic_onboarding_items_master
    FOR ALL TO authenticated
    USING (
        public.ic_jwt_is_admin() OR 
        public.ic_jwt_get_perm('admin_onboarding') = 'full'
    )
    WITH CHECK (
        public.ic_jwt_is_admin() OR 
        public.ic_jwt_get_perm('admin_onboarding') = 'full'
    );

-- =============================================
-- 4. JUNCTION TABLE: Staff Onboarding State
-- =============================================
DROP POLICY IF EXISTS "Staff Onboarding Select" ON public.ic_staff_onboarding;
DROP POLICY IF EXISTS "Staff Onboarding Write" ON public.ic_staff_onboarding;
DROP POLICY IF EXISTS "Staff Onboarding Insert" ON public.ic_staff_onboarding;
DROP POLICY IF EXISTS "Staff Onboarding Update" ON public.ic_staff_onboarding;
DROP POLICY IF EXISTS "Staff Onboarding Delete" ON public.ic_staff_onboarding;

CREATE POLICY "Staff Onboarding Select" ON public.ic_staff_onboarding
    FOR SELECT TO authenticated
    USING (
        public.ic_jwt_is_admin() OR 
        (public.ic_jwt_get_perm('admin_onboarding') IN ('full', 'read_only')) OR
        (public.ic_jwt_get_perm('staff_onboarding') IN ('full', 'read_only')) OR
        ((public.ic_jwt_get_perm('staff_onboarding') IN ('context_read_write', 'context_read_only')) AND public.ic_jwt_manages_staff(staff_id)) OR
        (public.ic_jwt_get_staff_id() = staff_id)
    );

CREATE POLICY "Staff Onboarding Write" ON public.ic_staff_onboarding
    FOR ALL TO authenticated
    USING (
        public.ic_jwt_is_admin() OR 
        (public.ic_jwt_get_perm('admin_onboarding') = 'full') OR
        (public.ic_jwt_get_perm('staff_onboarding') = 'full') OR
        ((public.ic_jwt_get_perm('staff_onboarding') = 'context_read_write') AND public.ic_jwt_manages_staff(staff_id))
    )
    WITH CHECK (
        public.ic_jwt_is_admin() OR 
        (public.ic_jwt_get_perm('admin_onboarding') = 'full') OR
        (public.ic_jwt_get_perm('staff_onboarding') = 'full') OR
        ((public.ic_jwt_get_perm('staff_onboarding') = 'context_read_write') AND public.ic_jwt_manages_staff(staff_id))
    );

COMMIT;

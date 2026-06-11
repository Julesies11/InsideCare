-- Migration: 2026061105_fix_rbac_and_audit_functions.sql
-- Description: Replaces the broken hard-coded CASE statement in ic_jwt_get_perm with a dynamic 
--              JSONB lookup to prevent "Undefined Column" errors and ensure search_path security.
--              Also updates ic_audit_trigger_func with security best practices.
-- Author: Senior Engineer / Security Researcher
-- Status: VERIFIED

BEGIN;

-- 1. Fix the core RBAC permission resolver (Dynamic & Resilient)
-- This removes the O(N) maintenance debt of the CASE statement.
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perm_text text;
  v_role_id uuid;
  v_jwt jsonb;
BEGIN
  -- Cache JWT once for performance
  v_jwt := auth.jwt();

  -- PATH 1: JWT PERFORMANCE PATH (Primary - Instant)
  v_perm_text := v_jwt -> 'app_metadata' -> 'permissions' ->> p_module;
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- PATH 2: DYNAMIC DATABASE FALLBACK (Resilient)
  -- 2a. Resolve Role Identity (Check JWT first, then DB)
  v_role_id := (v_jwt -> 'app_metadata' ->> 'role_id')::uuid;
  IF v_role_id IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.ic_staff WHERE auth_user_id = auth.uid() LIMIT 1;
  END IF;

  -- 2b. JSONB Lookup (Prevents "Undefined Column" errors if a module is missing from the table)
  IF v_role_id IS NOT NULL THEN
    SELECT (to_jsonb(rp) ->> p_module) INTO v_perm_text
    FROM public.ic_role_permissions rp
    WHERE rp.role_id = v_role_id;
  END IF;

  -- Default to 'none' if module is missing from table or value is null
  RETURN COALESCE(v_perm_text, 'none');
END;
$$;

-- 2. Update Audit Log Resolver (Security Hardening & Search Path)
-- Ensures 'title' (for Qualifications) and 'reference_id' (for Incidents/Notes) are correctly logged.
CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        target_data->>'title',
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
$$;

COMMIT;

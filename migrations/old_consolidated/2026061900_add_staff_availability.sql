-- Migration: 2026061900_add_staff_availability.sql
-- Description: Adds Gold Standard Staff Availability/Unavailability scheduling table.
-- Author: Senior Full Stack Developer (Antigravity)
-- Status: VERIFIED (ID-Driven, "No Legacy" standards)

BEGIN;

-- =============================================
-- 1. TABLE: Staff Availability
-- =============================================
CREATE TABLE public.ic_staff_availability (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    type text NOT NULL,
    day_of_week integer,
    specific_date date,
    start_time time without time zone NOT NULL DEFAULT '00:00:00',
    end_time time without time zone NOT NULL DEFAULT '23:59:59',
    is_available boolean NOT NULL DEFAULT false,
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    CONSTRAINT ic_staff_availability_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id) ON DELETE CASCADE,
    CONSTRAINT check_availability_type CHECK (type IN ('recurring', 'date_specific')),
    CONSTRAINT check_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
    CONSTRAINT check_conditional_fields CHECK (
        (type = 'recurring' AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (type = 'date_specific' AND specific_date IS NOT NULL AND day_of_week IS NULL)
    )
);

-- Enable RLS
ALTER TABLE public.ic_staff_availability ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_staff_availability_staff_active ON public.ic_staff_availability(staff_id, is_active);
CREATE INDEX idx_staff_availability_lookup ON public.ic_staff_availability(type, specific_date, day_of_week) WHERE is_active = true;

-- =============================================
-- 2. AUDIT TRIGGERS & LOGGING
-- =============================================

-- Apply ic_set_audit_columns trigger to availability table
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT OR UPDATE ON public.ic_staff_availability
FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

-- Apply ic_audit_trigger_func (Activity Log) to availability table
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT OR UPDATE OR DELETE ON public.ic_staff_availability
FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- Update Audit Log trigger function to resolve availability descriptions nicely
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
        ELSIF TG_TABLE_NAME = 'ic_staff_availability' THEN
            SELECT staff_name || ' Availability' INTO entity_name_val FROM public.ic_staff WHERE id = (target_data->>'staff_id')::uuid;
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

-- =============================================
-- 3. RLS POLICIES (Security Reviewed)
-- =============================================

-- Read: Authenticated users can view availability (schedulers need this for all active staff, and staff need this for themselves)
CREATE POLICY "RBAC staff_availability SELECT" ON public.ic_staff_availability 
    FOR SELECT TO authenticated 
    USING (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('staff_availability') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
        ic_jwt_get_staff_id() = staff_id
    );

-- Insert: Staff members can insert their own. Admins / managers can insert if assigned permission level context_read_write or higher.
CREATE POLICY "RBAC staff_availability INSERT" ON public.ic_staff_availability 
    FOR INSERT TO authenticated 
    WITH CHECK (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('staff_availability') = 'full' OR 
        ((ic_jwt_get_perm('staff_availability') = 'context_read_write') AND ic_jwt_manages_staff(staff_id)) OR
        ic_jwt_get_staff_id() = staff_id
    );

-- Update: Staff members can update their own. Admins / managers can update if assigned permission level context_read_write or higher.
CREATE POLICY "RBAC staff_availability UPDATE" ON public.ic_staff_availability 
    FOR UPDATE TO authenticated 
    USING (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('staff_availability') = 'full' OR 
        ((ic_jwt_get_perm('staff_availability') = 'context_read_write') AND ic_jwt_manages_staff(staff_id)) OR
        ic_jwt_get_staff_id() = staff_id
    )
    WITH CHECK (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('staff_availability') = 'full' OR 
        ((ic_jwt_get_perm('staff_availability') = 'context_read_write') AND ic_jwt_manages_staff(staff_id)) OR
        ic_jwt_get_staff_id() = staff_id
    );

-- Delete: Strictly restricted to Admin roles
CREATE POLICY "RBAC staff_availability DELETE" ON public.ic_staff_availability 
    FOR DELETE TO authenticated 
    USING (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('access_control') = 'full'
    );

COMMIT;

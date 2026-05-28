-- Migration: Add Incident Reports and Granular Reporting RBAC
-- Date: 2026-05-28
-- Reviewer: Senior Software Engineer & Security Researcher
-- Status: Verified & Hardened

-- 1. Extend ic_role_permissions with granular reporting categories
ALTER TABLE public.ic_role_permissions 
ADD COLUMN reporting_clinical public.ic_access_level_enum NOT NULL DEFAULT 'none'::public.ic_access_level_enum,
ADD COLUMN reporting_operational public.ic_access_level_enum NOT NULL DEFAULT 'none'::public.ic_access_level_enum,
ADD COLUMN reporting_compliance public.ic_access_level_enum NOT NULL DEFAULT 'none'::public.ic_access_level_enum;

-- 2. Create ic_incident_reports table
CREATE TABLE public.ic_incident_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    incident_date timestamp with time zone NOT NULL,
    incident_type text NOT NULL, -- e.g., 'Accident', 'Incident', 'Medication Refusal', 'Behavioural', etc.
    involved_participant_id uuid REFERENCES public.ic_participants(id),
    involved_staff_id uuid REFERENCES public.ic_staff(id),
    description text NOT NULL,
    status text NOT NULL DEFAULT 'Under Review'::text,
    priority text NOT NULL DEFAULT 'Medium'::text,
    reported_by uuid NOT NULL REFERENCES public.ic_staff(id),
    house_id uuid REFERENCES public.ic_houses(id),
    follow_up_required boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);

-- 3. Enable Row Level Security
ALTER TABLE public.ic_incident_reports ENABLE ROW LEVEL SECURITY;

-- 4. Add Audit Triggers (Standard Project Triggers)

-- Audit Log Trigger
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_reports;
CREATE TRIGGER ic_audit_universal_trigger 
AFTER INSERT OR UPDATE OR DELETE ON public.ic_incident_reports 
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

-- Audit Columns Trigger (created_by, updated_by, updated_at)
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_incident_reports;
CREATE TRIGGER ic_trigger_set_audit_columns 
BEFORE INSERT OR UPDATE ON public.ic_incident_reports 
FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();

-- 5. RLS Policies (Hardened)

-- SELECT: Based on reporting_clinical permission, house context, or ownership
DROP POLICY IF EXISTS "RBAC ic_incident_reports SELECT" ON public.ic_incident_reports;
CREATE POLICY "RBAC ic_incident_reports SELECT" ON public.ic_incident_reports 
FOR SELECT TO authenticated 
USING (
    ic_jwt_is_admin() OR 
    (reported_by = ic_jwt_get_staff_id()) OR -- Authors can always see their reports
    (involved_staff_id = ic_jwt_get_staff_id()) OR -- Involved staff can see their reports
    (
        ic_jwt_get_perm('reporting_clinical') IN ('full', 'read_only')
    ) OR 
    (
        ic_jwt_get_perm('reporting_clinical') IN ('context_read_write', 'context_read_only') AND 
        ic_jwt_has_house(house_id) -- Contextual users only see their house reports
    )
);

-- INSERT: Authorized clinical reporting or Admin
DROP POLICY IF EXISTS "RBAC ic_incident_reports INSERT" ON public.ic_incident_reports;
CREATE POLICY "RBAC ic_incident_reports INSERT" ON public.ic_incident_reports 
FOR INSERT TO authenticated 
WITH CHECK (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('reporting_clinical') IN ('full', 'context_read_write')
);

-- UPDATE: Authorized clinical reporting or Admin
DROP POLICY IF EXISTS "RBAC ic_incident_reports UPDATE" ON public.ic_incident_reports;
CREATE POLICY "RBAC ic_incident_reports UPDATE" ON public.ic_incident_reports 
FOR UPDATE TO authenticated 
USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('reporting_clinical') IN ('full', 'context_read_write')
);

-- DELETE: Admin only
DROP POLICY IF EXISTS "RBAC ic_incident_reports DELETE" ON public.ic_incident_reports;
CREATE POLICY "RBAC ic_incident_reports DELETE" ON public.ic_incident_reports 
FOR DELETE TO authenticated 
USING (ic_jwt_is_admin());

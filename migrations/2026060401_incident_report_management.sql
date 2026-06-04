-- Migration: Incident Report Management Enhancements
-- Date: 2026-06-04
-- Objective: Implement full structured incident reporting with RBAC-driven admin oversight.

-- 1. Extend ic_role_permissions with incident management
ALTER TABLE public.ic_role_permissions 
ADD COLUMN incident_management public.ic_access_level_enum NOT NULL DEFAULT 'none'::public.ic_access_level_enum;

-- 2. Create ic_incident_types_master
CREATE TABLE public.ic_incident_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);

-- Seed ic_incident_types_master
INSERT INTO public.ic_incident_types_master (name) VALUES 
('Medication Error (Pharmacy)'),
('Medication Error (Staff)'),
('Medication Incident (all other)'),
('Medication Refusal'),
('Behaviour of Concern'),
('Medical Incident'),
('Near Miss'),
('Accident'),
('Complaint'),
('Incident (all other)');

-- 3. Create ic_restrictive_practice_types_master
CREATE TABLE public.ic_restrictive_practice_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);

-- Seed ic_restrictive_practice_types_master
INSERT INTO public.ic_restrictive_practice_types_master (name) VALUES 
('Chemical Restraint'),
('Environmental Restraint'),
('Mechanical Restraint'),
('Physical Restraint'),
('Seclusion'),
('Other');

-- 4. Enhance ic_incident_reports table
ALTER TABLE public.ic_incident_reports 
    -- Basic Clinical & Detail
    ADD COLUMN incident_type_id uuid REFERENCES public.ic_incident_types_master(id),
    ADD COLUMN severity text CHECK (severity IN ('Low', 'Moderate', 'High')),
    ADD COLUMN summary text,
    ADD COLUMN details text,
    ADD COLUMN outcome text,
    ADD COLUMN witnesses text,
    ADD COLUMN notified_parties text,
    
    -- Restrictive Practice
    ADD COLUMN is_restrictive_practice boolean NOT NULL DEFAULT false,
    ADD COLUMN restrictive_practice_type_id uuid REFERENCES public.ic_restrictive_practice_types_master(id),
    ADD COLUMN restrictive_practice_description text,
    ADD COLUMN rp_start_time timestamp with time zone,
    ADD COLUMN rp_end_time timestamp with time zone,
    ADD COLUMN rp_reason text,
    ADD COLUMN rp_triggers text,
    ADD COLUMN rp_observed_behaviours text,
    ADD COLUMN rp_outcome text,

    -- Admin & NDIS
    ADD COLUMN is_ndis_reportable boolean NOT NULL DEFAULT false,
    ADD COLUMN admin_status text DEFAULT 'New' CHECK (admin_status IN ('New', 'Actioned', 'Referred', 'Closed')),
    ADD COLUMN admin_actions_taken text,
    ADD COLUMN ndis_reported_date date,
    
    -- Constraints
    ALTER COLUMN involved_participant_id SET NOT NULL;

-- 5. Enable RLS on new master tables
ALTER TABLE public.ic_incident_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_restrictive_practice_types_master ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Master Tables
CREATE POLICY "RBAC ic_incident_types_master SELECT" ON public.ic_incident_types_master 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "RBAC ic_incident_types_master ALL" ON public.ic_incident_types_master 
FOR ALL TO authenticated USING (ic_jwt_is_admin());

CREATE POLICY "RBAC ic_restrictive_practice_types_master SELECT" ON public.ic_restrictive_practice_types_master 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "RBAC ic_restrictive_practice_types_master ALL" ON public.ic_restrictive_practice_types_master 
FOR ALL TO authenticated USING (ic_jwt_is_admin());

-- 7. Update ic_incident_reports RLS Policies (Hardened)

-- SELECT: Based on reporting_clinical OR incident_management OR ownership
DROP POLICY IF EXISTS "RBAC ic_incident_reports SELECT" ON public.ic_incident_reports;
CREATE POLICY "RBAC ic_incident_reports SELECT" ON public.ic_incident_reports 
FOR SELECT TO authenticated 
USING (
    ic_jwt_is_admin() OR 
    (reported_by = ic_jwt_get_staff_id()) OR 
    (involved_staff_id = ic_jwt_get_staff_id()) OR 
    (ic_jwt_get_perm('reporting_clinical') IN ('full', 'read_only')) OR
    (ic_jwt_get_perm('incident_management') IN ('full', 'read_only')) OR
    (
        (ic_jwt_get_perm('reporting_clinical') IN ('context_read_write', 'context_read_only') OR 
         ic_jwt_get_perm('incident_management') IN ('context_read_write', 'context_read_only')) AND 
        ic_jwt_has_house(house_id)
    )
);

-- UPDATE: Allow staff to edit their own reports IF not closed, OR incident_management
DROP POLICY IF EXISTS "RBAC ic_incident_reports UPDATE" ON public.ic_incident_reports;
CREATE POLICY "RBAC ic_incident_reports UPDATE" ON public.ic_incident_reports 
FOR UPDATE TO authenticated 
USING (
    ic_jwt_is_admin() OR 
    (ic_jwt_get_perm('incident_management') IN ('full', 'context_read_write')) OR
    (
        reported_by = ic_jwt_get_staff_id() AND 
        admin_status = 'New' -- Staff can only edit if admin hasn't started processing
    )
);

-- 8. Add Audit Triggers to new tables
CREATE TRIGGER ic_audit_universal_trigger 
AFTER INSERT OR UPDATE OR DELETE ON public.ic_incident_types_master 
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

CREATE TRIGGER ic_trigger_set_audit_columns 
BEFORE INSERT OR UPDATE ON public.ic_incident_types_master 
FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();

CREATE TRIGGER ic_audit_universal_trigger 
AFTER INSERT OR UPDATE OR DELETE ON public.ic_restrictive_practice_types_master 
FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();

CREATE TRIGGER ic_trigger_set_audit_columns 
BEFORE INSERT OR UPDATE ON public.ic_restrictive_practice_types_master 
FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();

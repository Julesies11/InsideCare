-- Migration: 2026060600_dynamic_compliance_schema.sql
-- Description: Creates compliance master list and house-level requirement mapping, adds audit triggers, seeds initial data, and migrates existing staff compliance columns.

BEGIN;

-- 1. Create lookup table: ic_compliance_types_master
CREATE TABLE IF NOT EXISTS public.ic_compliance_types_master (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    compliance_name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_default_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL
);

-- Triggers for ic_compliance_types_master
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_compliance_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_compliance_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_compliance_types_master;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_compliance_types_master;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_compliance_types_master;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- Enable RLS
ALTER TABLE public.ic_compliance_types_master ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ic_compliance_types_master
DROP POLICY IF EXISTS "RBAC ic_compliance_types_master SELECT" ON public.ic_compliance_types_master;
CREATE POLICY "RBAC ic_compliance_types_master SELECT" ON public.ic_compliance_types_master 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC ic_compliance_types_master INSERT" ON public.ic_compliance_types_master;
CREATE POLICY "RBAC ic_compliance_types_master INSERT" ON public.ic_compliance_types_master 
    FOR INSERT TO authenticated WITH CHECK (
        public.ic_jwt_is_admin() 
        OR (public.ic_jwt_get_perm('master_lists'::text) = 'full'::text)
    );

DROP POLICY IF EXISTS "RBAC ic_compliance_types_master UPDATE" ON public.ic_compliance_types_master;
CREATE POLICY "RBAC ic_compliance_types_master UPDATE" ON public.ic_compliance_types_master 
    FOR UPDATE TO authenticated USING (
        public.ic_jwt_is_admin() 
        OR (public.ic_jwt_get_perm('master_lists'::text) = 'full'::text)
    ) WITH CHECK (
        public.ic_jwt_is_admin() 
        OR (public.ic_jwt_get_perm('master_lists'::text) = 'full'::text)
    );

DROP POLICY IF EXISTS "RBAC ic_compliance_types_master DELETE" ON public.ic_compliance_types_master;
CREATE POLICY "RBAC ic_compliance_types_master DELETE" ON public.ic_compliance_types_master 
    FOR DELETE TO authenticated USING (public.ic_jwt_is_admin());


-- 2. Create mapping table: ic_house_compliance_requirements
CREATE TABLE IF NOT EXISTS public.ic_house_compliance_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id uuid NOT NULL REFERENCES public.ic_houses(id) ON DELETE CASCADE,
    compliance_type_id uuid NOT NULL REFERENCES public.ic_compliance_types_master(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL,
    CONSTRAINT unique_house_compliance_requirement UNIQUE (house_id, compliance_type_id)
);

-- Triggers for ic_house_compliance_requirements
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_house_compliance_requirements;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_house_compliance_requirements FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_house_compliance_requirements;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_house_compliance_requirements FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_house_compliance_requirements;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_house_compliance_requirements FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_house_compliance_requirements;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_house_compliance_requirements FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_house_compliance_requirements;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_house_compliance_requirements FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- Enable RLS
ALTER TABLE public.ic_house_compliance_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ic_house_compliance_requirements
DROP POLICY IF EXISTS "RBAC ic_house_compliance_requirements SELECT" ON public.ic_house_compliance_requirements;
CREATE POLICY "RBAC ic_house_compliance_requirements SELECT" ON public.ic_house_compliance_requirements 
    FOR SELECT TO authenticated USING (
        public.ic_jwt_is_admin() 
        OR (public.ic_jwt_get_perm('houses'::text) = ANY (ARRAY['full'::text, 'read_only'::text]))
        OR ((public.ic_jwt_get_perm('houses'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND public.ic_jwt_has_house(house_id))
    );

DROP POLICY IF EXISTS "RBAC ic_house_compliance_requirements INSERT" ON public.ic_house_compliance_requirements;
CREATE POLICY "RBAC ic_house_compliance_requirements INSERT" ON public.ic_house_compliance_requirements 
    FOR INSERT TO authenticated WITH CHECK (
        public.ic_jwt_is_admin()
        OR (public.ic_jwt_get_perm('houses'::text) = 'full'::text)
        OR ((public.ic_jwt_get_perm('houses'::text) = 'context_read_write'::text) AND public.ic_jwt_has_house(house_id))
    );

DROP POLICY IF EXISTS "RBAC ic_house_compliance_requirements UPDATE" ON public.ic_house_compliance_requirements;
CREATE POLICY "RBAC ic_house_compliance_requirements UPDATE" ON public.ic_house_compliance_requirements 
    FOR UPDATE TO authenticated USING (
        public.ic_jwt_is_admin()
        OR (public.ic_jwt_get_perm('houses'::text) = 'full'::text)
        OR ((public.ic_jwt_get_perm('houses'::text) = 'context_read_write'::text) AND public.ic_jwt_has_house(house_id))
    ) WITH CHECK (
        public.ic_jwt_is_admin()
        OR (public.ic_jwt_get_perm('houses'::text) = 'full'::text)
        OR ((public.ic_jwt_get_perm('houses'::text) = 'context_read_write'::text) AND public.ic_jwt_has_house(house_id))
    );

DROP POLICY IF EXISTS "RBAC ic_house_compliance_requirements DELETE" ON public.ic_house_compliance_requirements;
CREATE POLICY "RBAC ic_house_compliance_requirements DELETE" ON public.ic_house_compliance_requirements 
    FOR DELETE TO authenticated USING (
        public.ic_jwt_is_admin()
        OR (public.ic_jwt_get_perm('houses'::text) = 'full'::text)
        OR ((public.ic_jwt_get_perm('houses'::text) = 'context_read_write'::text) AND public.ic_jwt_has_house(house_id))
    );


-- 3. Seed Default Master Compliance Types
INSERT INTO public.ic_compliance_types_master (compliance_name, description, is_default_global) VALUES
('NDIS Worker Screening Check', 'Mandatory NDIS screening check for support workers.', true),
('NDIS Orientation Module', 'NDIS Worker Orientation Module training completion.', true),
('NDIS Code of Conduct', 'Agreement and understanding of NDIS Code of Conduct.', true),
('NDIS Infection Control Training', 'Infection control training specifically tailored for NDIS support workers.', true),
('Drivers License', 'Valid state drivers license validation.', true),
('Comprehensive Car Insurance', 'Comprehensive vehicle insurance for staff operating transport.', true)
ON CONFLICT (compliance_name) DO UPDATE SET is_default_global = true;

-- 4. Map global defaults to all existing houses
INSERT INTO public.ic_house_compliance_requirements (house_id, compliance_type_id)
SELECT h.id, c.id
FROM public.ic_houses h
CROSS JOIN public.ic_compliance_types_master c
WHERE c.is_default_global = true
ON CONFLICT (house_id, compliance_type_id) DO NOTHING;

-- 5. Migrate existing compliance checks from staff table columns to ic_staff_compliance table
DO $$
DECLARE
    r RECORD;
    t_ndis_check UUID;
    t_ndis_orient UUID;
    t_ndis_conduct UUID;
    t_ndis_infect UUID;
    t_drivers_license UUID;
    t_car_insur UUID;
BEGIN
    SELECT id INTO t_ndis_check FROM public.ic_compliance_types_master WHERE compliance_name = 'NDIS Worker Screening Check';
    SELECT id INTO t_ndis_orient FROM public.ic_compliance_types_master WHERE compliance_name = 'NDIS Orientation Module';
    SELECT id INTO t_ndis_conduct FROM public.ic_compliance_types_master WHERE compliance_name = 'NDIS Code of Conduct';
    SELECT id INTO t_ndis_infect FROM public.ic_compliance_types_master WHERE compliance_name = 'NDIS Infection Control Training';
    SELECT id INTO t_drivers_license FROM public.ic_compliance_types_master WHERE compliance_name = 'Drivers License';
    SELECT id INTO t_car_insur FROM public.ic_compliance_types_master WHERE compliance_name = 'Comprehensive Car Insurance';

    FOR r IN SELECT * FROM public.ic_staff LOOP
        -- 1. NDIS Worker Screening Check
        IF r.ndis_worker_screening_check = true OR r.ndis_worker_screening_check_expiry IS NOT NULL THEN
            INSERT INTO public.ic_staff_compliance (staff_id, compliance_name, completion_date, expiry_date, status)
            VALUES (r.id, 'NDIS Worker Screening Check', NULL, r.ndis_worker_screening_check_expiry, 'Complete')
            ON CONFLICT DO NOTHING;
        END IF;

        -- 2. NDIS Orientation Module
        IF r.ndis_orientation_module = true OR r.ndis_orientation_module_expiry IS NOT NULL THEN
            INSERT INTO public.ic_staff_compliance (staff_id, compliance_name, completion_date, expiry_date, status)
            VALUES (r.id, 'NDIS Orientation Module', NULL, r.ndis_orientation_module_expiry, 'Complete')
            ON CONFLICT DO NOTHING;
        END IF;

        -- 3. NDIS Code of Conduct
        IF r.ndis_code_of_conduct = true OR r.ndis_code_of_conduct_expiry IS NOT NULL THEN
            INSERT INTO public.ic_staff_compliance (staff_id, compliance_name, completion_date, expiry_date, status)
            VALUES (r.id, 'NDIS Code of Conduct', NULL, r.ndis_code_of_conduct_expiry, 'Complete')
            ON CONFLICT DO NOTHING;
        END IF;

        -- 4. NDIS Infection Control Training
        IF r.ndis_infection_control_training = true OR r.ndis_infection_control_training_expiry IS NOT NULL THEN
            INSERT INTO public.ic_staff_compliance (staff_id, compliance_name, completion_date, expiry_date, status)
            VALUES (r.id, 'NDIS Infection Control Training', NULL, r.ndis_infection_control_training_expiry, 'Complete')
            ON CONFLICT DO NOTHING;
        END IF;

        -- 5. Drivers License
        IF r.drivers_license = true OR r.drivers_license_expiry IS NOT NULL THEN
            INSERT INTO public.ic_staff_compliance (staff_id, compliance_name, completion_date, expiry_date, status)
            VALUES (r.id, 'Drivers License', NULL, r.drivers_license_expiry, 'Complete')
            ON CONFLICT DO NOTHING;
        END IF;

        -- 6. Comprehensive Car Insurance
        IF r.comprehensive_car_insurance = true OR r.comprehensive_car_insurance_expiry IS NOT NULL THEN
            INSERT INTO public.ic_staff_compliance (staff_id, compliance_name, completion_date, expiry_date, status)
            VALUES (r.id, 'Comprehensive Car Insurance', NULL, r.comprehensive_car_insurance_expiry, 'Complete')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

COMMIT;

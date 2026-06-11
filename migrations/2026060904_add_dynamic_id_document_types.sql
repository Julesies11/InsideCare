-- Migration: 2026060904_add_dynamic_id_document_types.sql
-- Description: Adds requires_document boolean to compliance types master, creates configurable id document types table, seeds default values, and sets up RLS and triggers.

BEGIN;

-- 1. Alter ic_compliance_types_master to support dynamic document requirements
ALTER TABLE public.ic_compliance_types_master
ADD COLUMN IF NOT EXISTS requires_document boolean NOT NULL DEFAULT false;

-- 2. Update default requirements to set requires_document = true
UPDATE public.ic_compliance_types_master
SET requires_document = true
WHERE compliance_name IN ('100 Points of ID', 'Drivers License', 'Comprehensive Car Insurance');

-- 3. Create public.ic_id_document_types table
CREATE TABLE IF NOT EXISTS public.ic_id_document_types (
    id text PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    points integer NOT NULL,
    expiry_required boolean DEFAULT false,
    placeholder text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL
);

-- Triggers for ic_id_document_types (Audit and setting fields)
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_id_document_types;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_id_document_types;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_id_document_types;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_id_document_types;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_id_document_types;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- Enable RLS
ALTER TABLE public.ic_id_document_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ic_id_document_types
DROP POLICY IF EXISTS "RBAC id_document_types SELECT" ON public.ic_id_document_types;
CREATE POLICY "RBAC id_document_types SELECT" ON public.ic_id_document_types 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC id_document_types ALL" ON public.ic_id_document_types;
CREATE POLICY "RBAC id_document_types ALL" ON public.ic_id_document_types 
    FOR ALL TO authenticated USING (
        public.ic_jwt_is_admin()
    );

-- Seed ID Document Types
INSERT INTO public.ic_id_document_types (id, name, category, points, expiry_required, placeholder) VALUES
('passport_aus', 'Australian Passport', 'primary', 70, true, 'Passport Number'),
('passport_foreign', 'Foreign Passport', 'primary', 70, true, 'Passport Number'),
('birth_cert', 'Australian Birth Certificate', 'primary', 70, false, 'Registration Number'),
('citizenship_cert', 'Australian Citizenship Certificate', 'primary', 70, false, 'Certificate Number'),
('drivers_license', 'Australian Driver''s License', 'secondary', 40, true, 'License Number'),
('medicare', 'Medicare Card', 'secondary', 40, true, 'Medicare Card Number'),
('student_id', 'Student ID (with Photo)', 'secondary', 40, true, 'Student Number'),
('utility_bill', 'Utility Bill (Name & Address)', 'secondary', 25, false, 'Account Number'),
('bank_statement', 'Bank Statement', 'secondary', 25, false, 'Account/Card Reference')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    points = EXCLUDED.points,
    expiry_required = EXCLUDED.expiry_required,
    placeholder = EXCLUDED.placeholder;

COMMIT;

-- Migration: 2026060203_add_medication_types_table_and_columns.sql
-- Description: Creates ic_medication_types_master, and normalizes ic_medications_master by adding new columns and dropping old ones.

BEGIN;

-- 1. Create lookup table: ic_medication_types_master
CREATE TABLE IF NOT EXISTS public.ic_medication_types_master (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_type_name text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL
);

-- Add triggers for audit columns (Use IF NOT EXISTS where possible or drop before create)
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_medication_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_medication_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_medication_types_master;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_medication_types_master;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_medication_types_master;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- Enable RLS
ALTER TABLE public.ic_medication_types_master ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "RBAC ic_medication_types_master SELECT" ON public.ic_medication_types_master;
CREATE POLICY "RBAC ic_medication_types_master SELECT" ON public.ic_medication_types_master 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC ic_medication_types_master ADMIN ONLY" ON public.ic_medication_types_master;
CREATE POLICY "RBAC ic_medication_types_master ADMIN ONLY" ON public.ic_medication_types_master 
    FOR ALL TO authenticated USING (public.ic_jwt_get_perm('access_control') = 'full');

-- 2. Prepare ic_medications_master
-- Empty existing data (CASCADE removes linked participant medications)
TRUNCATE TABLE public.ic_medications_master CASCADE;

-- Modify schema
ALTER TABLE public.ic_medications_master 
    ADD COLUMN IF NOT EXISTS type_id uuid NOT NULL REFERENCES public.ic_medication_types_master(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS brand_name text,
    ADD COLUMN IF NOT EXISTS sub_class text,
    ADD COLUMN IF NOT EXISTS purpose text,
    ADD COLUMN IF NOT EXISTS contraindications text;

-- Drop category column if it exists
ALTER TABLE public.ic_medications_master DROP COLUMN IF EXISTS category;

COMMIT;

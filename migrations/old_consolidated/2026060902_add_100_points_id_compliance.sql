-- Migration: 2026060902_add_100_points_id_compliance.sql
-- Description: Creates normalized table for verified compliance documents, seeds the 100 Points of ID requirement, and configures RLS and triggers.

BEGIN;

-- 1. Drop the temporary jsonb column if it was created
ALTER TABLE public.ic_staff_compliance 
DROP COLUMN IF EXISTS metadata;

-- 2. Seed '100 Points of ID' compliance requirement
INSERT INTO public.ic_compliance_types_master (compliance_name, description, is_default_global)
VALUES (
    '100 Points of ID', 
    'Verification of identity using the standard 100-point ID checklist (primary and secondary documents).', 
    true
)
ON CONFLICT (compliance_name) 
DO UPDATE SET 
    description = EXCLUDED.description,
    is_default_global = EXCLUDED.is_default_global;

-- 3. Map the new global requirement to all existing houses
INSERT INTO public.ic_house_compliance_requirements (house_id, compliance_type_id)
SELECT h.id, c.id
FROM public.ic_houses h
CROSS JOIN public.ic_compliance_types_master c
WHERE c.compliance_name = '100 Points of ID'
ON CONFLICT (house_id, compliance_type_id) DO NOTHING;

-- 4. Create public.ic_staff_compliance_documents table
CREATE TABLE IF NOT EXISTS public.ic_staff_compliance_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_compliance_id uuid NOT NULL REFERENCES public.ic_staff_compliance(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    document_number text NOT NULL,
    expiry_date date,
    file_name text,
    file_path text,
    points integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.ic_staff(id) ON DELETE SET NULL
);

-- Triggers for ic_staff_compliance_documents (Audit and setting fields)
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- Enable RLS
ALTER TABLE public.ic_staff_compliance_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ic_staff_compliance_documents
DROP POLICY IF EXISTS "RBAC staff_compliance_documents SELECT" ON public.ic_staff_compliance_documents;
CREATE POLICY "RBAC staff_compliance_documents SELECT" ON public.ic_staff_compliance_documents 
    FOR SELECT TO authenticated USING (
        public.ic_jwt_is_admin() OR 
        public.ic_jwt_get_perm('staff_compliance') IN ('full', 'read_only') OR 
        EXISTS (
            SELECT 1 FROM public.ic_staff_compliance sc 
            WHERE sc.id = staff_compliance_id 
              AND (
                  ((public.ic_jwt_get_perm('staff_compliance') IN ('context_read_write', 'context_read_only')) AND public.ic_jwt_manages_staff(sc.staff_id)) OR
                  public.ic_jwt_get_staff_id() = sc.staff_id
              )
        )
    );

DROP POLICY IF EXISTS "RBAC staff_compliance_documents ALL" ON public.ic_staff_compliance_documents;
CREATE POLICY "RBAC staff_compliance_documents ALL" ON public.ic_staff_compliance_documents 
    FOR ALL TO authenticated USING (
        public.ic_jwt_is_admin() OR 
        public.ic_jwt_get_perm('staff_compliance') = 'full' OR 
        EXISTS (
            SELECT 1 FROM public.ic_staff_compliance sc
            WHERE sc.id = staff_compliance_id 
              AND (public.ic_jwt_get_perm('staff_compliance') = 'context_read_write') 
              AND public.ic_jwt_manages_staff(sc.staff_id)
        )
    );

-- Index for join performance
CREATE INDEX IF NOT EXISTS idx_ic_staff_compliance_docs_compliance_id
  ON public.ic_staff_compliance_documents (staff_compliance_id);

COMMIT;

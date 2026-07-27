-- =============================================================================
-- Migration: 2026060601_staff_compliance_fk
-- Description: Add compliance_type_id FK to ic_staff_compliance.
--              Backfills existing rows by matching compliance_name to
--              ic_compliance_types_master.compliance_name.
--              The compliance_name text column is RETAINED as a display label
--              and for audit trigger compatibility.
-- =============================================================================

BEGIN;

-- 1. Add nullable FK column
ALTER TABLE public.ic_staff_compliance
  ADD COLUMN IF NOT EXISTS compliance_type_id uuid
    REFERENCES public.ic_compliance_types_master(id)
    ON DELETE SET NULL;

-- 2. Backfill: match existing rows by compliance_name (LIMIT 1 for determinism)
UPDATE public.ic_staff_compliance sc
SET compliance_type_id = (
  SELECT ctm.id
  FROM public.ic_compliance_types_master ctm
  WHERE ctm.compliance_name = sc.compliance_name
  LIMIT 1
)
WHERE sc.compliance_type_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.ic_compliance_types_master ctm
    WHERE ctm.compliance_name = sc.compliance_name
  );

-- 3. Index for join performance
CREATE INDEX IF NOT EXISTS idx_ic_staff_compliance_type_id
  ON public.ic_staff_compliance(compliance_type_id);

COMMIT;

-- =============================================================================
-- Migration: 2026060602_staff_compliance_optimisation
-- Description: Fixes database-level issues identified in the compliance audit:
--   1. Resolve legacy staff compliance NULL compliance_type_id rows.
--   2. Deduplicate existing records per (staff_id, compliance_type_id).
--   3. Create a partial UNIQUE index to prevent future duplicate records.
--   4. Add performance indexes on the three high-frequency lookup columns.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Resolve legacy records with NULL compliance_type_id using compliance_name
-- ---------------------------------------------------------------------------
UPDATE public.ic_staff_compliance c
SET compliance_type_id = ctm.id
FROM public.ic_compliance_types_master ctm
WHERE c.compliance_type_id IS NULL
  AND ctm.compliance_name = c.compliance_name
  AND ctm.is_active = TRUE;

-- ---------------------------------------------------------------------------
-- 1. Deduplicate legacy records to prevent unique index constraint violation
--    Keeps the most recently updated or created record for each type per staff.
-- ---------------------------------------------------------------------------
DELETE FROM public.ic_staff_compliance a
WHERE a.compliance_type_id IS NOT NULL
  AND a.id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY staff_id, compliance_type_id
               ORDER BY COALESCE(updated_at, created_at, '1970-01-01'::timestamp) DESC, id DESC
             ) as rn
      FROM public.ic_staff_compliance
      WHERE compliance_type_id IS NOT NULL
    ) t
    WHERE t.rn > 1
  );

-- ---------------------------------------------------------------------------
-- 2. Partial unique index: prevent duplicate compliance records per type
--    Partial (WHERE compliance_type_id IS NOT NULL) so any remaining legacy
--    orphan rows are unaffected.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_ic_staff_compliance_type
  ON public.ic_staff_compliance (staff_id, compliance_type_id)
  WHERE compliance_type_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Performance indexes on the three high-frequency lookup columns
-- ---------------------------------------------------------------------------

-- ic_staff_compliance: staff_id is the primary filter but has no index.
-- FK constraints do NOT auto-create indexes in PostgreSQL.
CREATE INDEX IF NOT EXISTS idx_ic_staff_compliance_staff_id
  ON public.ic_staff_compliance (staff_id);

-- ic_house_compliance_requirements: house_id used in WHERE house_id IN (...)
CREATE INDEX IF NOT EXISTS idx_ic_house_compliance_req_house_id
  ON public.ic_house_compliance_requirements (house_id);

-- ic_house_staff_assignments: staff_id queried on every staff detail page load
CREATE INDEX IF NOT EXISTS idx_ic_house_staff_assign_staff_id
  ON public.ic_house_staff_assignments (staff_id);

COMMIT;

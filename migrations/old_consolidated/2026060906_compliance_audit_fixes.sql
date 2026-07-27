-- Migration: 2026060906_compliance_audit_fixes.sql
-- Description: Adds system_category column to compliance types master to replace hardcoded UI logic.

BEGIN;

-- 1. Add system_category column
ALTER TABLE public.ic_compliance_types_master
ADD COLUMN IF NOT EXISTS system_category VARCHAR(50);

-- 2. Seed system_category for 100 Points of ID
UPDATE public.ic_compliance_types_master
SET system_category = 'id_verification'
WHERE compliance_name = '100 Points of ID';

-- 3. Add comment for documentation
COMMENT ON COLUMN public.ic_compliance_types_master.system_category IS 'Special category identifier for UI logic (e.g., id_verification) to avoid hardcoding strings.';

COMMIT;

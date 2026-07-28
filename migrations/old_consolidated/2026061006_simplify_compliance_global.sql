-- Migration: 2026061006_simplify_compliance_global.sql
-- Description: Drops house-specific compliance requirements table and removes the global default flag, making all compliance types universal.

BEGIN;

-- 1. Drop the house compliance requirements table
DROP TABLE IF EXISTS public.ic_house_compliance_requirements CASCADE;

-- 2. Drop the is_default_global column from master table
ALTER TABLE public.ic_compliance_types_master
DROP COLUMN IF EXISTS is_default_global CASCADE;

COMMIT;

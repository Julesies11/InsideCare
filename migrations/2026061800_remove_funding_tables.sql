-- Migration: Remove Redundant Funding Tables
-- Description: Drops the ic_participant_funding, ic_funding_sources_master, and ic_funding_types_master tables and cascading objects.

BEGIN;

-- Drop participant funding table (depends on master tables)
DROP TABLE IF EXISTS public.ic_participant_funding CASCADE;

-- Drop funding sources master table
DROP TABLE IF EXISTS public.ic_funding_sources_master CASCADE;

-- Drop funding types master table
DROP TABLE IF EXISTS public.ic_funding_types_master CASCADE;

COMMIT;

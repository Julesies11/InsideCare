-- Migration: 2026060205_remove_common_dosages_column.sql
-- Description: Removes the deprecated 'common_dosages' column from ic_medications_master.

BEGIN;

ALTER TABLE public.ic_medications_master 
    DROP COLUMN IF EXISTS common_dosages;

COMMIT;

-- Migration: 2026061103_fix_compliance_trigger.sql
-- Description: Combines fixes for two critical bugs identified during E2E testing.
-- 1. Alters ic_dispatch_jwt_sync_webhook to run as SECURITY DEFINER to allow reading from vault.
-- 2. Drops the legacy ic_trigger_update_compliance_status which incorrectly intercepts enum values.

BEGIN;

-- FIX 1: Allow webhook trigger to read from vault by running as SECURITY DEFINER
ALTER FUNCTION public.ic_dispatch_jwt_sync_webhook() SECURITY DEFINER;

-- FIX 2: Drop legacy compliance status trigger and function
-- The frontend now calculates 'Expired' / 'Expiring Soon' dynamically based on the date.
-- This prevents the 'invalid input value for enum ic_compliance_status_enum: "Expiring Soon"' error.
DROP TRIGGER IF EXISTS ic_trigger_update_compliance_status ON public.ic_staff_compliance;
DROP FUNCTION IF EXISTS public.ic_update_compliance_status();

COMMIT;
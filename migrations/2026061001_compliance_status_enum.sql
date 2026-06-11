-- Migration: Standardize Compliance Statuses and Implement ic_compliance_status_enum
-- Created at: 2026-06-10
-- Peer Reviewed for: Type safety, idempotency, and removal of legacy constraints/triggers.

BEGIN;

-- 1. DROP LEGACY CONSTRAINTS, TRIGGERS & FUNCTIONS
-- Drop the check constraint that only allows capitalized strings (blocks our lowercase Enum)
ALTER TABLE public.ic_staff_compliance DROP CONSTRAINT IF EXISTS staff_compliance_status_check;

-- Drop the legacy trigger that is no longer compatible with the Enum type
DROP TRIGGER IF EXISTS ic_trigger_update_compliance_status ON public.ic_staff_compliance;
DROP FUNCTION IF EXISTS public.ic_update_compliance_status();

-- 2. Create the new standardized status enum
DO $$ BEGIN
    CREATE TYPE public.ic_compliance_status_enum AS ENUM (
        'complete',
        'in_progress',
        'not_applicable'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Data Normalization: Standardize existing data using explicit casting
-- We use ::text casting to ensure the WHERE clauses work whether the column is currently text OR enum.

-- Map legacy 'Complete' and its variants to 'complete'
UPDATE public.ic_staff_compliance 
SET status = 'complete' 
WHERE status::text IN ('Complete', 'complete', 'Compliant', 'compliant');

-- Map legacy 'Incomplete', 'Expired', etc. to 'in_progress'
-- Note: 'Expired' is now a dynamic state calculated by the API/Frontend, not a DB status.
UPDATE public.ic_staff_compliance 
SET status = 'in_progress' 
WHERE status::text IN ('Incomplete', 'In Progress', 'in_progress', 'in-progress', 'Expiring', 'Expired', 'Expiring Soon');

-- Map legacy 'Not Applicable' variants to 'not_applicable'
UPDATE public.ic_staff_compliance 
SET status = 'not_applicable' 
WHERE status::text IN ('Not Applicable', 'not_applicable', 'N/A', 'n/a');

-- Catch-all for any other values or NULLs to ensure the column is ready for the enum type change
UPDATE public.ic_staff_compliance 
SET status = 'in_progress' 
WHERE status::text NOT IN ('complete', 'in_progress', 'not_applicable') OR status IS NULL;

-- 4. Schema Update: Apply the new enum type
ALTER TABLE public.ic_staff_compliance 
    ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.ic_staff_compliance 
    ALTER COLUMN status TYPE public.ic_compliance_status_enum 
    USING (status::text::public.ic_compliance_status_enum);

-- 5. Set the new gold standard default
ALTER TABLE public.ic_staff_compliance 
    ALTER COLUMN status SET DEFAULT 'in_progress'::public.ic_compliance_status_enum;

COMMIT;

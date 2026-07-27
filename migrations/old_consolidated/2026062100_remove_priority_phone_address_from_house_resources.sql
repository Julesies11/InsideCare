-- Migration: Remove priority, phone, address from house resources table
-- Description: Drop priority, phone, address columns from public.ic_house_resources table

BEGIN;

-- Drop priority column
ALTER TABLE public.ic_house_resources DROP COLUMN IF EXISTS priority;

-- Drop phone column
ALTER TABLE public.ic_house_resources DROP COLUMN IF EXISTS phone;

-- Drop address column
ALTER TABLE public.ic_house_resources DROP COLUMN IF EXISTS address;

COMMIT;

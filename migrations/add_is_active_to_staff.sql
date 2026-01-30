-- Migration: Change staff.status to staff.is_active for consistency
-- Date: 2026-01-28

-- Step 1: Add is_active column
ALTER TABLE public.staff 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Step 2: Migrate existing data
UPDATE public.staff 
SET is_active = (status = 'active');

-- Step 3: Drop the old status column and its check constraint
ALTER TABLE public.staff 
DROP CONSTRAINT IF EXISTS staff_status_check;

ALTER TABLE public.staff 
DROP COLUMN status;

-- Step 4: Add index for is_active (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_staff_is_active 
ON public.staff USING btree (is_active);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.staff.is_active IS 'Indicates if the staff member is currently active (true) or inactive (false)';

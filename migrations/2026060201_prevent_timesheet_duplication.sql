-- Migration: Fix Timesheet Duplication
-- Description: Adds a unique constraint to prevent duplicate timesheets for the same shift/staff.
-- Includes a cleanup step to remove older duplicates before applying the constraint.

-- 1. Cleanup: Identify and remove duplicate timesheets, keeping only the most recently created one for each (staff_id, shift_id) pair.
DELETE FROM public.ic_timesheets
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY staff_id, shift_id 
             ORDER BY 
               CASE 
                 WHEN status = 'approved' THEN 1
                 WHEN status = 'pending' THEN 2
                 WHEN status = 'rejected' THEN 3
                 ELSE 4 
               END ASC,
               created_at DESC
           ) as row_num
    FROM public.ic_timesheets
    WHERE shift_id IS NOT NULL
  ) t
  WHERE t.row_num > 1
);

-- 2. Add Unique Constraint: Ensure one staff member can only have one timesheet per shift.
-- We only apply this to records where shift_id is not null (legacy or manual clock-ins might lack a shift_id).
ALTER TABLE public.ic_timesheets
DROP CONSTRAINT IF EXISTS ic_timesheets_staff_id_shift_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS ic_timesheets_staff_shift_unique_idx 
ON public.ic_timesheets (staff_id, shift_id) 
WHERE (shift_id IS NOT NULL);

COMMENT ON INDEX public.ic_timesheets_staff_shift_unique_idx IS 'Prevents duplicate timesheets for the same staff/shift combination.';

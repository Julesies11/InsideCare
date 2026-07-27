-- Migration: Fix Shift Note Duplication
-- Description: Adds a unique constraint to prevent duplicate shift notes for the same shift/staff.
-- Includes a cleanup step to remove older or less complete duplicates before applying the constraint.

-- 1. Cleanup: Identify and remove duplicate shift notes, prioritizing more complete records
DELETE FROM public.ic_shift_notes
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY staff_id, shift_id 
             ORDER BY 
               -- Prioritize notes that are actually filled out
               (CASE WHEN (overall_presentation IS NOT NULL OR shift_summary IS NOT NULL OR full_note IS NOT NULL) THEN 1 ELSE 2 END) ASC,
               created_at DESC
           ) as row_num
    FROM public.ic_shift_notes
    WHERE shift_id IS NOT NULL AND status = 'active'
  ) t
  WHERE t.row_num > 1
);

-- 2. Add Unique Constraint: Ensure one staff member can only have one active shift note per shift.
-- Note: We use a partial index to allow multiple notes if some are soft-deleted (status != 'active')
ALTER TABLE public.ic_shift_notes
DROP CONSTRAINT IF EXISTS ic_shift_notes_staff_id_shift_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS ic_shift_notes_staff_shift_unique_idx 
ON public.ic_shift_notes (staff_id, shift_id) 
WHERE (shift_id IS NOT NULL AND status = 'active');

COMMENT ON INDEX public.ic_shift_notes_staff_shift_unique_idx IS 'Prevents duplicate active shift notes for the same staff/shift combination.';

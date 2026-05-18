-- Migration: Add attribution and status to checklist submission items
-- Description: Adds completed_by and status columns to track which staff member completed each item.

-- 1. Add columns
ALTER TABLE public.house_checklist_submission_items 
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';

-- 2. Backfill status from is_completed
UPDATE public.house_checklist_submission_items 
SET status = 'Completed' 
WHERE is_completed = true AND (status = 'Pending' OR status IS NULL);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.house_checklist_submission_items.completed_by IS 'The staff member who completed this specific checklist item.';
COMMENT ON COLUMN public.house_checklist_submission_items.status IS 'The current status of this item (e.g., Pending, Completed).';

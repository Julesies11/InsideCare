-- Migration: Fix Checklist Progress Saving
-- Description: Adds a unique constraint to house_checklist_submission_items to enable UPSERT functionality.
-- Without this, checklist progress cannot be updated, only inserted as duplicates.
delete from public.house_checklist_submission_items;

ALTER TABLE public.house_checklist_submission_items 
ADD CONSTRAINT house_checklist_submission_items_submission_item_unique 
UNIQUE (submission_id, item_id);

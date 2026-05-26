-- Migration: Migrate Files and Cleanup Obsolete Hyphenated Buckets
-- Date: 2026-05-26
-- Description: Migrates remaining files to correct buckets and removes unused hyphenated buckets.

BEGIN;

-- 1. Migrate existing files to the correct underscored buckets in the storage schema
UPDATE storage.objects SET bucket_id = 'ic_checklist_attachments' WHERE bucket_id = 'ic_checklist-attachments';
UPDATE storage.objects SET bucket_id = 'ic_branch_documents'      WHERE bucket_id = 'ic_branch-documents';
UPDATE storage.objects SET bucket_id = 'ic_house_documents'       WHERE bucket_id = 'ic_house-documents';
UPDATE storage.objects SET bucket_id = 'ic_participant_documents' WHERE bucket_id = 'ic_participant-documents';
UPDATE storage.objects SET bucket_id = 'ic_participant_photos'    WHERE bucket_id = 'ic_participant-photos';
UPDATE storage.objects SET bucket_id = 'ic_staff_documents'       WHERE bucket_id = 'ic_staff-documents';
UPDATE storage.objects SET bucket_id = 'ic_staff_photos'          WHERE bucket_id = 'ic_staff-photos';

-- 2. Delete the old buckets from the storage schema now that they are completely empty
-- Note: This will succeed because we moved the objects above.
DELETE FROM storage.buckets WHERE id IN (
  'ic_branch-documents',
  'ic_checklist-attachments',
  'ic_house-documents',
  'ic_participant-documents',
  'ic_participant-photos',
  'ic_staff-documents',
  'ic_staff-photos'
);

COMMIT;

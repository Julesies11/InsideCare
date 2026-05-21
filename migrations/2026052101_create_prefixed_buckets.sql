-- Migration: Create new 'ic_' prefixed storage buckets
-- Description: Creates the 7 required buckets for InsideCare with correct security settings.
-- Note: Run this AFTER the main table rename migration.

BEGIN;

-- 1. Create the new buckets
-- All buckets are created as 'Private' (public = false) per GEMINI.md security standards.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('ic_branch-documents', 'ic_branch-documents', false, NULL, NULL),
    ('ic_checklist-attachments', 'ic_checklist-attachments', false, NULL, NULL),
    ('ic_house-documents', 'ic_house-documents', false, NULL, NULL),
    ('ic_participant-documents', 'ic_participant-documents', false, NULL, NULL),
    ('ic_participant-photos', 'ic_participant-photos', false, NULL, NULL),
    ('ic_staff-documents', 'ic_staff-documents', false, NULL, NULL),
    ('ic_staff-photos', 'ic_staff-photos', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Verify creation
SELECT id, name, public FROM storage.buckets WHERE id LIKE 'ic_%';

COMMIT;

-- Migration: Copy Storage Metadata from old buckets to new 'ic_' buckets
-- WARNING: This ONLY copies database records. It does NOT physically move files in S3.
-- Links in the new buckets will be BROKEN until physical files are moved via API or CLI.

BEGIN;

-- 1. Disable triggers to allow manual management of the storage schema
ALTER TABLE storage.objects DISABLE TRIGGER ALL;

-- 2. Copy metadata records
DO $$
DECLARE
    bucket_map RECORD;
BEGIN
    -- Define the mapping between old and new buckets
    FOR bucket_map IN (
        SELECT 'branch-documents' as old_id, 'ic_branch-documents' as new_id UNION ALL
        SELECT 'checklist-attachments', 'ic_checklist-attachments' UNION ALL
        SELECT 'house-documents', 'ic_house-documents' UNION ALL
        SELECT 'participant-documents', 'ic_participant-documents' UNION ALL
        SELECT 'participant-photos', 'ic_participant-photos' UNION ALL
        SELECT 'staff-documents', 'ic_staff-documents' UNION ALL
        SELECT 'staff-photos', 'ic_staff-photos'
    )
    LOOP
        -- Insert new records into storage.objects
        -- Note: We omit 'id' so Postgres generates new UUIDs, preventing primary key collisions.
        INSERT INTO storage.objects (
            bucket_id, 
            name, 
            owner, 
            created_at, 
            updated_at, 
            last_accessed_at, 
            metadata, 
            path_tokens
        )
        SELECT 
            bucket_map.new_id, 
            name, 
            owner, 
            created_at, 
            updated_at, 
            last_accessed_at, 
            metadata, 
            path_tokens
        FROM storage.objects
        WHERE bucket_id = bucket_map.old_id;

        RAISE NOTICE 'Copied metadata from % to %', bucket_map.old_id, bucket_map.new_id;
    END LOOP;
END $$;

-- 3. Re-enable triggers
ALTER TABLE storage.objects ENABLE TRIGGER ALL;

-- 4. Verification Query
SELECT bucket_id, count(*) FROM storage.objects WHERE bucket_id LIKE 'ic_%' GROUP BY bucket_id;

COMMIT;

-- Migration: 2026061004_standardize_id_types_to_uuid.sql
-- Description: Converts ic_id_document_types.id to UUID and updates all references.
-- Peer Reviewed for: Polymorphic execution (handles any starting type), idempotency, and dynamic SQL safety.

BEGIN;

-- 1. Preparation: Resolve legacy records where document_type is the human-readable 'name'
-- We use dynamic SQL (EXECUTE) to prevent the planner from complaining about type mismatches if document_type is already uuid.
DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'ic_staff_compliance_documents' AND column_name = 'document_type') = 'text' THEN
        EXECUTE '
            UPDATE public.ic_staff_compliance_documents scd
            SET document_type = idt.id
            FROM public.ic_id_document_types idt
            WHERE LOWER(scd.document_type) = LOWER(idt.name)
              AND (scd.document_type ~* ''^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'') = false';
    END IF;
END $$;

-- 2. Create mapping for existing text IDs (slugs) to new UUIDs
CREATE TEMP TABLE id_type_mapping (
    old_id text,
    new_id uuid DEFAULT gen_random_uuid()
);

-- Only map records that are NOT already UUIDs (checking the source table)
INSERT INTO id_type_mapping (old_id)
SELECT id::text FROM public.ic_id_document_types
WHERE (id::text ~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$') = false;

-- 3. Aggressive Cleanup: Delete any orphaned records that don't match a known document type
-- We cast to text safely in the WHERE clause.
DELETE FROM public.ic_staff_compliance_documents
WHERE (document_type::text NOT IN (SELECT old_id FROM id_type_mapping))
  AND (document_type::text ~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$') = false;

-- 4. Update ic_staff_compliance_documents to use the new UUIDs
-- Again, use dynamic SQL to handle the assignment target type gracefully.
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'ic_staff_compliance_documents' AND column_name = 'document_type') = 'text' THEN
        EXECUTE '
            UPDATE public.ic_staff_compliance_documents scd
            SET document_type = m.new_id::text
            FROM id_type_mapping m
            WHERE scd.document_type = m.old_id';
    ELSE
        -- If already UUID, we don''t need to update the slugs because they couldn''t have been stored.
        -- But for safety, if there was a partial migration:
        EXECUTE '
            UPDATE public.ic_staff_compliance_documents scd
            SET document_type = m.new_id
            FROM id_type_mapping m
            WHERE scd.document_type::text = m.old_id';
    END IF;
END $$;

-- 5. Final Schema Transformation for ic_id_document_types
DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'ic_id_document_types' AND column_name = 'id') = 'text' THEN
        ALTER TABLE public.ic_id_document_types DROP CONSTRAINT IF EXISTS ic_id_document_types_pkey CASCADE;
        ALTER TABLE public.ic_id_document_types ADD COLUMN new_uuid_id uuid;

        UPDATE public.ic_id_document_types idt
        SET new_uuid_id = m.new_id
        FROM id_type_mapping m
        WHERE idt.id = m.old_id;

        -- For existing UUIDs (if any), just copy them over
        UPDATE public.ic_id_document_types idt
        SET new_uuid_id = id::uuid
        WHERE new_uuid_id IS NULL;

        ALTER TABLE public.ic_id_document_types DROP COLUMN id;
        ALTER TABLE public.ic_id_document_types RENAME COLUMN new_uuid_id TO id;
        ALTER TABLE public.ic_id_document_types ALTER COLUMN id SET NOT NULL;
        ALTER TABLE public.ic_id_document_types ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE public.ic_id_document_types ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 6. Final Schema Transformation for ic_staff_compliance_documents
DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'ic_staff_compliance_documents' AND column_name = 'document_type') = 'text' THEN
        ALTER TABLE public.ic_staff_compliance_documents 
        ALTER COLUMN document_type TYPE uuid USING document_type::uuid;
    END IF;
END $$;

-- 7. Ensure Foreign Key
-- Always drop and recreate to ensure it points to the new UUID primary key correctly.
ALTER TABLE public.ic_staff_compliance_documents DROP CONSTRAINT IF EXISTS ic_staff_compliance_documents_document_type_fkey;
ALTER TABLE public.ic_staff_compliance_documents
ADD CONSTRAINT ic_staff_compliance_documents_document_type_fkey
FOREIGN KEY (document_type) REFERENCES public.ic_id_document_types(id) ON DELETE CASCADE;

COMMIT;

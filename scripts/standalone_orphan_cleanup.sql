-- ======================================================================================
-- Standalone Data Cleanup Script
-- Purpose: Nullify any orphaned 'created_by' or 'updated_by' IDs that do not exist in ic_staff.
-- ======================================================================================

DO $$
DECLARE
    t text;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Starting standalone orphan cleanup...';
    
    -- Dynamically query base tables starting with 'ic_' that have 'created_by' or 'updated_by' columns
    FOR t IN 
        SELECT tbl.table_name 
        FROM information_schema.tables tbl
        JOIN information_schema.columns col 
          ON col.table_name = tbl.table_name 
         AND col.table_schema = tbl.table_schema
        WHERE tbl.table_schema = 'public' 
          AND tbl.table_type = 'BASE TABLE'
          AND tbl.table_name LIKE 'ic_%' 
          AND col.column_name IN ('created_by', 'updated_by')
        GROUP BY tbl.table_name
    LOOP
        RAISE NOTICE 'Processing table: %', t;
        
        -- Drop existing FK constraints on created_by/updated_by to avoid violations during update
        FOR constraint_record IN 
            SELECT conname as constraint_name FROM pg_constraint con
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
            WHERE con.contype = 'f' 
            AND con.conrelid = format('public.%I', t)::regclass 
            AND att.attname IN ('created_by', 'updated_by')
        LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, constraint_record.constraint_name);
        END LOOP;
        
        -- Disable triggers temporarily to prevent audit trigger interference
        EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', t);
        
        -- Check and update created_by if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'created_by') THEN
            EXECUTE format('UPDATE public.%I t SET created_by = s.id FROM public.ic_staff s WHERE t.created_by = s.auth_user_id AND NOT EXISTS (SELECT 1 FROM public.ic_staff s2 WHERE s2.id = t.created_by)', t);
            EXECUTE format('UPDATE public.%I SET created_by = NULL WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = created_by)', t);
        END IF;

        -- Check and update updated_by if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_by') THEN
            EXECUTE format('UPDATE public.%I t SET updated_by = s.id FROM public.ic_staff s WHERE t.updated_by = s.auth_user_id AND NOT EXISTS (SELECT 1 FROM public.ic_staff s2 WHERE s2.id = t.updated_by)', t);
            EXECUTE format('UPDATE public.%I SET updated_by = NULL WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = updated_by)', t);
        END IF;
        
        -- Re-enable triggers
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);
    END LOOP;
    
    RAISE NOTICE 'Cleanup complete.';
END $$;

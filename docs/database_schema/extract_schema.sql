-- This single query returns the entire schema metadata for InsideCare tables (prefixed with ic_).
-- Run this in the Supabase SQL Editor and copy the results.

WITH table_security AS (
    SELECT 
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
    FROM 
        pg_class c
    JOIN 
        pg_namespace n ON n.oid = c.relnamespace
    WHERE 
        n.nspname = 'public' 
        AND c.relkind = 'r'
        AND c.relname LIKE 'ic_%'
),
table_columns AS (
    SELECT 
        cols.table_name,
        jsonb_agg(
            jsonb_build_object(
                'name', cols.column_name,
                'type', cols.data_type,
                'nullable', cols.is_nullable,
                'default', cols.column_default,
                'pk', EXISTS (
                    SELECT 1 FROM information_schema.key_column_usage kcu
                    JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                    WHERE kcu.table_name = cols.table_name 
                      AND kcu.column_name = cols.column_name 
                      AND tc.constraint_type = 'PRIMARY KEY'
                )
            ) ORDER BY cols.ordinal_position
        ) AS columns_metadata
    FROM 
        information_schema.columns cols
    WHERE 
        cols.table_schema = 'public'
        AND cols.table_name LIKE 'ic_%'
    GROUP BY 
        cols.table_name
),
table_fks AS (
    SELECT
        tc.table_name,
        jsonb_agg(
            jsonb_build_object(
                'col', kcu.column_name,
                'ref_table', ccu.table_name,
                'ref_col', ccu.column_name
            )
        ) AS fks_metadata
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
      AND tc.table_name LIKE 'ic_%'
    GROUP BY tc.table_name
),
all_tables AS (
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'name', ts.table_name,
                'rls_enabled', ts.rls_enabled,
                'policy_count', ts.policy_count,
                'columns', tc.columns_metadata,
                'foreign_keys', COALESCE(tf.fks_metadata, '[]'::jsonb)
            ) ORDER BY ts.table_name
        ) AS tables_json
    FROM 
        table_security ts
    LEFT JOIN 
        table_columns tc ON ts.table_name = tc.table_name
    LEFT JOIN 
        table_fks tf ON ts.table_name = tf.table_name
),
all_enums AS (
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'name', t.typname,
                'values', (SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid = t.oid)
            ) ORDER BY t.typname
        ) AS enums_json
    FROM 
        pg_type t 
    JOIN 
        pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE 
        n.nspname = 'public' AND t.typtype = 'e'
        AND t.typname LIKE 'ic_%'
),
all_functions AS (
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'name', p.proname,
                'args', pg_get_function_arguments(p.oid),
                'returns', t.typname,
                'definition', p.prosrc
            ) ORDER BY p.proname
        ) AS functions_json
    FROM 
        pg_proc p
    JOIN 
        pg_namespace n ON p.pronamespace = n.oid
    JOIN 
        pg_type t ON p.prorettype = t.oid
    WHERE 
        n.nspname = 'public' AND p.prokind = 'f'
        AND p.proname LIKE 'ic_%'
),
all_triggers AS (
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'table', event_object_table,
                'name', trigger_name,
                'event', event_manipulation,
                'timing', action_timing,
                'definition', action_statement
            ) ORDER BY event_object_table, trigger_name
        ) AS triggers_json
    FROM 
        information_schema.triggers
    WHERE 
        trigger_schema = 'public'
        AND event_object_table LIKE 'ic_%'
),
all_extensions AS (
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'name', extname,
                'version', extversion
            ) ORDER BY extname
        ) AS extensions_json
    FROM 
        pg_extension
)
SELECT 
    (SELECT tables_json FROM all_tables) AS tables,
    (SELECT enums_json FROM all_enums) AS enums,
    (SELECT functions_json FROM all_functions) AS functions,
    (SELECT triggers_json FROM all_triggers) AS triggers,
    (SELECT extensions_json FROM all_extensions) AS extensions;

-- query all RBAC policies for InsideCare tables
SELECT * FROM pg_policies
WHERE tablename LIKE 'ic_%'
ORDER BY tablename, CMD;

-- query all storage buckets for InsideCare
WITH bucket_list AS (
      SELECT b.id AS bucket_id, b.name AS bucket_name
      FROM storage.buckets b
      WHERE b.name LIKE 'ic_%'
    ),
    policy_text AS (
      SELECT
        p.policyname,
        p.cmd AS operation,
        p.roles,
        p.qual AS using_expression,
        p.with_check AS with_check_expression
      FROM pg_policies p
      WHERE p.schemaname = 'storage'
        AND p.tablename = 'objects'
        -- Filter policies that likely affect our buckets
        AND (p.qual ~ 'ic_' OR p.with_check ~ 'ic_')
    )
    SELECT
      COALESCE(bl.bucket_name, 'GLOBAL / OTHER') as bucket_context,
      pt.policyname,
      pt.operation,
      pt.roles,
      pt.using_expression,
      pt.with_check_expression
    FROM policy_text pt
    LEFT JOIN bucket_list bl
      ON (
        pt.using_expression ~ ('\y' || bl.bucket_id || '\y')
        OR pt.with_check_expression ~ ('\y' || bl.bucket_id || '\y')
      )
    ORDER BY bucket_context, pt.policyname;

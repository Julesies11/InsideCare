-- Migration: 2026061204_global_master_list_read_access.sql
-- Description: Standardizes SELECT access for all Master/Lookup tables.
--              Ensures all authenticated staff can read dropdown data (e.g., Leave Types, Clinical Scales)
--              regardless of their specific 'Master Lists' management permission.
--              Management (INSERT/UPDATE/DELETE) remains strictly restricted.
-- Standard: IC-GOLD-DATABASE-MIGRATION-V2
-- Verified by: Senior Software Engineer & Security Researcher

BEGIN;

-- Helper function to apply the global read policy to a list of tables
DO $$ 
DECLARE
    tbl_name text;
    -- Comprehensive list of all "Lookup" and "Master" tables that should be globally readable
    master_tables text[] := ARRAY[
        'ic_behaviour_intensity_master',
        'ic_behaviour_types_master',
        'ic_bowel_amounts_master',
        'ic_bowel_assistance_master',
        'ic_compliance_types_master',
        'ic_contact_types_master',
        'ic_employment_types_master',
        'ic_funding_sources_master',
        'ic_funding_types_master',
        'ic_house_calendar_event_types_master',
        'ic_house_types_master',
        'ic_hygiene_levels_master',
        'ic_incident_types_master',
        'ic_medication_types_master',
        'ic_medications_master',
        'ic_mtm_diet_types_master',
        'ic_mtm_fluid_intake_master',
        'ic_mtm_fluids_master',
        'ic_mtm_meal_intake_master',
        'ic_mtm_swallowing_concerns_master',
        'ic_nutrition_intake_master',
        'ic_nutrition_meal_types_master',
        'ic_restrictive_practice_types_master',
        'ic_seizure_types_master',
        'ic_sleep_quality_master',
        'ic_sleep_types_master',
        'ic_leave_types',
        'ic_departments',
        'ic_branches',
        'ic_id_document_types'
    ];
    policy_record RECORD;
BEGIN
    FOREACH tbl_name IN ARRAY master_tables
    LOOP
        -- 1. Check if the table exists to avoid migration failure
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl_name) THEN
            
            -- 2. Dynamically drop ALL existing SELECT policies for this table
            -- This ensures a clean slate and avoids "Policy already exists" or conflicting logic.
            FOR policy_record IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' 
                  AND tablename = tbl_name 
                  AND cmd = 'SELECT'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, tbl_name);
            END LOOP;

            -- 3. Create the unified global read policy (PERMISSIVE)
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', 'RBAC ' || tbl_name || ' SELECT GLOBAL', tbl_name);
            
            -- 4. Ensure RLS is enabled
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
            
        END IF;
    END LOOP;
END $$;

-- Note: All INSERT, UPDATE, DELETE policies remain untouched and 
-- continue to require ic_jwt_is_admin() or master_lists = 'full'.

COMMIT;

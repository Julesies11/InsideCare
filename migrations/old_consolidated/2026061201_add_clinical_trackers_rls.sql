-- Migration: Add Missing RLS Policies to Clinical Tracker Master Tables
-- Description: The previous migration enabled RLS but omitted the policies. This script adds standard access controls securely and idempotently.
-- Verified by: Senior Security Researcher

BEGIN;

-- Function to create standard policies for master tables idempotently
CREATE OR REPLACE FUNCTION create_tracker_master_policies(target_table text) RETURNS void AS $$
BEGIN
    -- Idempotency: Drop existing policies if they exist to prevent errors on re-runs
    EXECUTE format('DROP POLICY IF EXISTS "RBAC %I SELECT (Staff)" ON public.%I;', target_table, target_table);
    EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL (Admin)" ON public.%I;', target_table, target_table);

    -- 1. Read Policy: All authenticated staff with relevant permissions can read active options
    -- Includes edge cases for staff who only configure care plans but don't write shift notes directly
    EXECUTE format('
        CREATE POLICY "RBAC %I SELECT (Staff)" ON public.%I
        FOR SELECT
        USING (
            ic_jwt_is_admin() 
            OR (ic_jwt_get_perm(''master_lists''::text) = ANY (ARRAY[''full''::text, ''read_only''::text])) 
            OR (ic_jwt_get_perm(''shift_notes''::text) = ANY (ARRAY[''context_read''::text, ''context_read_write''::text, ''full''::text]))
            OR (ic_jwt_get_perm(''participant_clinical_trackers''::text) = ANY (ARRAY[''context_read''::text, ''context_read_write''::text, ''full''::text]))
            OR (ic_jwt_get_perm(''participants''::text) = ANY (ARRAY[''context_read''::text, ''context_read_write''::text, ''full''::text]))
        );
    ', target_table, target_table);

    -- 2. Admin Full Access Policy
    EXECUTE format('
        CREATE POLICY "RBAC %I ALL (Admin)" ON public.%I
        FOR ALL
        USING (
            ic_jwt_is_admin()
        )
        WITH CHECK (
            ic_jwt_is_admin()
        );
    ', target_table, target_table);
END;
$$ LANGUAGE plpgsql;

-- Apply policies to all 13 tables
SELECT create_tracker_master_policies('ic_sleep_quality_master');
SELECT create_tracker_master_policies('ic_sleep_types_master');
SELECT create_tracker_master_policies('ic_behaviour_intensity_master');
SELECT create_tracker_master_policies('ic_nutrition_meal_types_master');
SELECT create_tracker_master_policies('ic_nutrition_intake_master');
SELECT create_tracker_master_policies('ic_mtm_diet_types_master');
SELECT create_tracker_master_policies('ic_mtm_fluids_master');
SELECT create_tracker_master_policies('ic_mtm_meal_intake_master');
SELECT create_tracker_master_policies('ic_mtm_fluid_intake_master');
SELECT create_tracker_master_policies('ic_mtm_swallowing_concerns_master');
SELECT create_tracker_master_policies('ic_hygiene_levels_master');
SELECT create_tracker_master_policies('ic_bowel_amounts_master');
SELECT create_tracker_master_policies('ic_bowel_assistance_master');

-- Cleanup helper function
DROP FUNCTION create_tracker_master_policies(text);

COMMIT;

-- ========================================================================================
-- ALIGN RBAC ENUM & HARDEN POLICIES (CORRECTED SCHEMA)
-- Date: 2026-05-18
-- Objective: Align access_level_enum with frontend constants using correct column names.
-- ========================================================================================

BEGIN;

-- 1. UPDATE access_level_enum VALUES
DO $$
BEGIN
    -- Add context_read_only
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'access_level_enum' AND e.enumlabel = 'context_read_only') THEN
        ALTER TYPE public.access_level_enum ADD VALUE 'context_read_only';
    END IF;
    
    -- Add context_read_write
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'access_level_enum' AND e.enumlabel = 'context_read_write') THEN
        ALTER TYPE public.access_level_enum ADD VALUE 'context_read_write';
    END IF;
END $$;

-- 2. MIGRATE EXISTING DATA (Corrected Column Names)
-- 'participant_profiles' -> 'participants'
-- 'staff_profiles' -> 'employees'
-- 'house_profiles' -> 'houses'
-- 'documents' -> (not in current schema, likely handled by participants/employees/houses)
UPDATE public.role_permissions 
SET 
    participants = CASE WHEN participants::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE participants END,
    employees = CASE WHEN employees::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE employees END,
    houses = CASE WHEN houses::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE houses END,
    shift_notes = CASE WHEN shift_notes::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE shift_notes END,
    roster_board = CASE WHEN roster_board::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE roster_board END,
    timesheets = CASE WHEN timesheets::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE timesheets END,
    leave_requests = CASE WHEN leave_requests::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE leave_requests END,
    house_checklists = CASE WHEN house_checklists::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE house_checklists END,
    shift_routines = CASE WHEN shift_routines::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE shift_routines END,
    access_control = CASE WHEN access_control::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE access_control END,
    master_lists = CASE WHEN master_lists::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE master_lists END,
    activity_log = CASE WHEN activity_log::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE activity_log END,
    my_roster = CASE WHEN my_roster::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE my_roster END,
    my_timesheets = CASE WHEN my_timesheets::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE my_timesheets END,
    my_leave = CASE WHEN my_leave::text = 'context_locked' THEN 'context_read_write'::public.access_level_enum ELSE my_leave END;

-- 3. ENSURE UNIQUE CONSTRAINT ON role_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'role_permissions_role_id_key' 
        AND conrelid = 'public.role_permissions'::regclass
    ) THEN
        ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_key UNIQUE (role_id);
    END IF;
END $$;

COMMIT;

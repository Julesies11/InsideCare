-- ========================================================================================
-- NORMALIZED RBAC SYSTEM 2026-05-13
-- Objective: Implement granular, column-based role permissions with 4 access levels.
-- ========================================================================================

-- 1. ENSURE UNIQUE ROLE NAMES (Prerequisite for ON CONFLICT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'roles_name_key' 
        AND conrelid = 'public.roles'::regclass
    ) THEN
        ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
    END IF;
END $$;

-- 2. CREATE ACCESS LEVEL ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_enum') THEN
        CREATE TYPE public.access_level_enum AS ENUM ('full', 'context_locked', 'read_only', 'none');
    END IF;
END $$;

-- 3. CREATE ROLE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID PRIMARY KEY REFERENCES public.roles(id) ON DELETE CASCADE,
    participant_profiles public.access_level_enum NOT NULL DEFAULT 'none',
    participant_notes public.access_level_enum NOT NULL DEFAULT 'none',
    house_profiles public.access_level_enum NOT NULL DEFAULT 'none',
    roster_board public.access_level_enum NOT NULL DEFAULT 'none',
    assign_staff_to_shift public.access_level_enum NOT NULL DEFAULT 'none',
    timesheets_submit public.access_level_enum NOT NULL DEFAULT 'none',
    timesheets_approve public.access_level_enum NOT NULL DEFAULT 'none',
    house_checklists public.access_level_enum NOT NULL DEFAULT 'none',
    shift_routines public.access_level_enum NOT NULL DEFAULT 'none',
    documents public.access_level_enum NOT NULL DEFAULT 'none',
    leave_requests public.access_level_enum NOT NULL DEFAULT 'none',
    master_lists public.access_level_enum NOT NULL DEFAULT 'none',
    activity_log public.access_level_enum NOT NULL DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only Admins (Management/Director) can manage permissions
-- Check if policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'role_permissions' 
        AND policyname = 'Admins manage role permissions'
    ) THEN
        CREATE POLICY "Admins manage role permissions" ON public.role_permissions
            FOR ALL TO authenticated
            USING (
                (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
                (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Management', 'Director', 'Admin')
            );
    END IF;
END $$;

-- 4. SEED INITIAL ROLES AND PERMISSIONS
-- Ensure we have the canonical role set
INSERT INTO public.roles (name, description, is_active)
VALUES 
  ('Admin', 'Global administrator with full system control.', true),
  ('Supervisor', 'Roster and house management for assigned locations.', true),
  ('Finance Manager', 'Payroll and financial data access.', true),
  ('House Manager', 'Operational control over specific houses.', true),
  ('Support Worker', 'Direct care delivery and reporting.', true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Ensure all existing roles have a default record in role_permissions
INSERT INTO public.role_permissions (role_id)
SELECT id FROM public.roles
ON CONFLICT (role_id) DO NOTHING;

-- Populate permissions for these roles
DO $$
DECLARE
    r_admin_id UUID;
    r_supervisor_id UUID;
    r_finance_id UUID;
    r_house_manager_id UUID;
    r_support_worker_id UUID;
BEGIN
    SELECT id INTO r_admin_id FROM public.roles WHERE name = 'Admin';
    SELECT id INTO r_supervisor_id FROM public.roles WHERE name = 'Supervisor';
    SELECT id INTO r_finance_id FROM public.roles WHERE name = 'Finance Manager';
    SELECT id INTO r_house_manager_id FROM public.roles WHERE name = 'House Manager';
    SELECT id INTO r_support_worker_id FROM public.roles WHERE name = 'Support Worker';

    -- Admin: Full Access to everything
    IF r_admin_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_admin_id, 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'full', participant_notes = 'full', house_profiles = 'full', roster_board = 'full', assign_staff_to_shift = 'full', timesheets_submit = 'full', timesheets_approve = 'full', house_checklists = 'full', shift_routines = 'full', documents = 'full', leave_requests = 'full', master_lists = 'full', activity_log = 'full';
    END IF;

    -- Supervisor: Roster/House control + Clinical Awareness
    IF r_supervisor_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_supervisor_id, 'context_locked', 'context_locked', 'context_locked', 'context_locked', 'full', 'read_only', 'context_locked', 'context_locked', 'full', 'context_locked', 'full', 'none', 'context_locked')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'context_locked', participant_notes = 'context_locked', house_profiles = 'context_locked', roster_board = 'context_locked', assign_staff_to_shift = 'full', timesheets_submit = 'read_only', timesheets_approve = 'context_locked', house_checklists = 'context_locked', shift_routines = 'full', documents = 'context_locked', leave_requests = 'full', master_lists = 'none', activity_log = 'context_locked';
    END IF;

    -- Finance Manager: Read-only global access to pay-relevant data
    IF r_finance_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_finance_id, 'none', 'none', 'none', 'none', 'none', 'none', 'full', 'none', 'none', 'read_only', 'none', 'none', 'read_only')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'none', participant_notes = 'none', house_profiles = 'none', roster_board = 'none', assign_staff_to_shift = 'none', timesheets_submit = 'none', timesheets_approve = 'full', house_checklists = 'none', shift_routines = 'none', documents = 'read_only', leave_requests = 'none', master_lists = 'none', activity_log = 'read_only';
    END IF;

    -- Support Worker: Personal shifts, limited clinical reporting
    IF r_support_worker_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_support_worker_id, 'context_locked', 'context_locked', 'context_locked', 'read_only', 'none', 'full', 'none', 'context_locked', 'full', 'context_locked', 'full', 'none', 'read_only')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'context_locked', participant_notes = 'context_locked', house_profiles = 'context_locked', roster_board = 'read_only', assign_staff_to_shift = 'none', timesheets_submit = 'full', timesheets_approve = 'none', house_checklists = 'context_locked', shift_routines = 'full', documents = 'context_locked', leave_requests = 'full', master_lists = 'none', activity_log = 'read_only';
    END IF;
END $$;

-- 5. UPDATE SYNC FUNCTION TO INCLUDE PERMISSIONS IN JWT
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  -- Look up the name and permissions of the new role
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'participant_notes', participant_notes,
    'house_profiles', house_profiles,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'documents', documents,
    'leave_requests', leave_requests,
    'master_lists', master_lists,
    'activity_log', activity_log
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  -- Update the auth.users metadata if the staff record is linked to an auth user
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PROPAGATE PERMISSION CHANGES
-- Helper to sync a specific staff member
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'participant_notes', participant_notes,
    'house_profiles', house_profiles,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'documents', documents,
    'leave_requests', leave_requests,
    'master_lists', master_lists,
    'activity_log', activity_log
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.propagate_role_permission_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_record RECORD;
BEGIN
  FOR v_staff_record IN 
    SELECT id FROM public.staff WHERE role_id = NEW.role_id AND auth_user_id IS NOT NULL
  LOOP
    PERFORM public.sync_staff_role_to_metadata_for_staff(v_staff_record.id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_propagate_role_permission_changes ON public.role_permissions;
CREATE TRIGGER trigger_propagate_role_permission_changes
AFTER UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.propagate_role_permission_changes();

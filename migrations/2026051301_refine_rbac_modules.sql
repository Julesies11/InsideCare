-- ========================================================================================
-- REFINE RBAC MODULES 2026-05-13
-- Objective: Rename, drop, and add columns to role_permissions for precision.
-- ========================================================================================

-- 1. ALTER ROLE_PERMISSIONS TABLE
ALTER TABLE public.role_permissions 
    RENAME COLUMN participant_notes TO shift_notes;

ALTER TABLE public.role_permissions 
    DROP COLUMN master_lists,
    DROP COLUMN activity_log,
    DROP COLUMN documents;

ALTER TABLE public.role_permissions 
    ADD COLUMN staff_profiles public.access_level_enum NOT NULL DEFAULT 'none',
    ADD COLUMN participant_documents public.access_level_enum NOT NULL DEFAULT 'none',
    ADD COLUMN house_documents public.access_level_enum NOT NULL DEFAULT 'none',
    ADD COLUMN staff_documents public.access_level_enum NOT NULL DEFAULT 'none';

-- 2. UPDATE SYNC FUNCTIONS
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'staff_profiles', staff_profiles,
    'house_profiles', house_profiles,
    'shift_notes', shift_notes,
    'participant_documents', participant_documents,
    'house_documents', house_documents,
    'staff_documents', staff_documents,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'leave_requests', leave_requests
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
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
    'staff_profiles', staff_profiles,
    'house_profiles', house_profiles,
    'shift_notes', shift_notes,
    'participant_documents', participant_documents,
    'house_documents', house_documents,
    'staff_documents', staff_documents,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'leave_requests', leave_requests
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

-- 3. RE-SYNC ALL STAFF (Fires triggers to update JWTs with new schema)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.staff WHERE auth_user_id IS NOT NULL LOOP
        PERFORM public.sync_staff_role_to_metadata_for_staff(r.id);
    END LOOP;
END $$;

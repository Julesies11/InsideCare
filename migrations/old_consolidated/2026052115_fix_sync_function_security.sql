-- Migration: Fix SECURITY DEFINER for auth.users sync function
BEGIN;

-- Ensure the sync function for staff permissions is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.ic_sync_staff_role_to_metadata_for_staff(p_staff_id uuid) 
RETURNS void AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.ic_staff WHERE id = p_staff_id;
  
  -- Sync role name
  SELECT role_name INTO v_role_name FROM public.ic_roles WHERE id = v_staff_record.role_id;
  
  -- Sync permissions
  SELECT jsonb_build_object(
    'my_roster', my_roster, 'my_timesheets', my_timesheets, 'my_leave', my_leave, 'shift_routines', shift_routines,
    'participants', participants, 'shift_notes', shift_notes,
    'employees', employees, 'timesheets', timesheets, 'leave_requests', leave_requests, 'roster_board', roster_board,
    'houses', houses, 'house_checklists', house_checklists,
    'access_control', access_control, 'master_lists', master_lists, 'activity_log', activity_log
  ) INTO v_permissions FROM public.ic_role_permissions WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'role_name', v_role_name, 
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
    ) 
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

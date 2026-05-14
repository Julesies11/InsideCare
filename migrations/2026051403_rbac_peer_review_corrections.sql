-- ========================================================================================
-- RBAC PEER REVIEW CORRECTIONS 2026-05-14
-- Objective: Optimize RLS performance and fix edge cases identified in peer review.
-- ========================================================================================

-- 1. ENHANCE SYNC FUNCTIONS (Performance Optimization)
-- Including staff_id in metadata avoids a join to public.staff in every RLS check.
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  -- Look up the name and permissions of the role
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
  
  -- Update the auth.users metadata if the staff record is linked to an auth user
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'staff_id', NEW.id,
        'is_staff', true,
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
        'staff_id', v_staff_record.id,
        'is_staff', true,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RE-SYNC ALL STAFF (Populate staff_id and is_staff in JWTs)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.staff WHERE auth_user_id IS NOT NULL LOOP
        PERFORM public.sync_staff_role_to_metadata_for_staff(r.id);
    END LOOP;
END $$;

-- 3. OPTIMIZE RLS HELPERS
CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
  -- Prefer metadata for performance, fallback to table query for safety
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'staff_id')::uuid,
    (SELECT id FROM public.staff WHERE auth_user_id = auth.uid())
  );
$$ LANGUAGE sql STABLE;

-- 4. FIX EDGE CASE: GLOBAL CHECKLISTS
-- Ensure is_global column exists (discovered as missing in some environments)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'house_checklists' 
        AND column_name = 'is_global'
    ) THEN
        ALTER TABLE public.house_checklists ADD COLUMN is_global boolean DEFAULT false;
    END IF;
END $$;

-- Update House Checklists policy to allow read access to global checklists regardless of house assignment.
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    public.house_checklists.is_global = true OR
    (
        public.get_access_level('house_checklists') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_checklists.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

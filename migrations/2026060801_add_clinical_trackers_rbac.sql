-- Migration: Add participant_clinical_trackers column to public.ic_role_permissions and update RLS/Helper functions
-- Date: 2026-06-08
-- Reviewer: Senior Software Engineer & Security Researcher
-- Status: Verified & Hardened

BEGIN;

-- 1. Extend ic_role_permissions with participant_clinical_trackers module
ALTER TABLE public.ic_role_permissions 
ADD COLUMN IF NOT EXISTS participant_clinical_trackers public.ic_access_level_enum NOT NULL DEFAULT 'none'::public.ic_access_level_enum;

-- 2. Update ic_jwt_get_perm helper function to include new module and restore all granular modules
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) 
RETURNS text 
AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
  SELECT 
    CASE p_module
      -- Personal Modules (Staff Portal)
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      
      -- Care Management (Base and Granular)
      WHEN 'participants' THEN participants::text
      WHEN 'participant_goals' THEN participant_goals::text
      WHEN 'participant_behaviour' THEN participant_behaviour::text
      WHEN 'participant_support_needs' THEN participant_support_needs::text
      WHEN 'participant_mealtime' THEN participant_mealtime::text
      WHEN 'participant_medical_routine' THEN participant_medical_routine::text
      WHEN 'participant_clinical_trackers' THEN participant_clinical_trackers::text
      WHEN 'participant_medications' THEN participant_medications::text
      WHEN 'participant_emergency' THEN participant_emergency::text
      WHEN 'participant_contacts' THEN participant_contacts::text
      WHEN 'participant_documents' THEN participant_documents::text
      WHEN 'participant_shift_notes' THEN participant_shift_notes::text
      WHEN 'participant_activity_log' THEN participant_activity_log::text
      WHEN 'shift_notes' THEN shift_notes::text
      
      -- Employees & HR (Base and Granular)
      WHEN 'employees' THEN employees::text
      WHEN 'staff_employment' THEN staff_employment::text
      WHEN 'staff_availability' THEN staff_availability::text
      WHEN 'staff_emergency' THEN staff_emergency::text
      WHEN 'staff_compliance' THEN staff_compliance::text
      WHEN 'staff_training' THEN staff_training::text
      WHEN 'staff_documents' THEN staff_documents::text
      WHEN 'staff_roster' THEN staff_roster::text
      WHEN 'staff_leave' THEN staff_leave::text
      WHEN 'staff_warnings' THEN staff_warnings::text
      WHEN 'staff_activity_log' THEN staff_activity_log::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      WHEN 'roster_board' THEN roster_board::text
      
      -- Operations & Facilities (Base and Granular)
      WHEN 'houses' THEN houses::text
      WHEN 'house_management' THEN house_management::text
      WHEN 'house_operations' THEN house_operations::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'house_checklist_history' THEN house_checklist_history::text
      WHEN 'house_resources' THEN house_resources::text
      WHEN 'house_staff' THEN house_staff::text
      WHEN 'house_activity_log' THEN house_activity_log::text
      
      -- System Administration
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      WHEN 'incident_management' THEN incident_management::text
      
      -- Reporting
      WHEN 'reporting_clinical' THEN reporting_clinical::text
      WHEN 'reporting_operational' THEN reporting_operational::text
      WHEN 'reporting_compliance' THEN reporting_compliance::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions rp
  JOIN public.ic_staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. Update ic_participants UPDATE policy to allow update access for users with participant_clinical_trackers write permissions
DROP POLICY IF EXISTS "RBAC participants UPDATE" ON public.ic_participants;
CREATE POLICY "RBAC participants UPDATE" ON public.ic_participants 
FOR UPDATE TO authenticated 
USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participants') = 'full' OR
    ic_jwt_get_perm('participant_behaviour') = 'full' OR
    ic_jwt_get_perm('participant_support_needs') = 'full' OR
    ic_jwt_get_perm('participant_mealtime') = 'full' OR
    ic_jwt_get_perm('participant_medical_routine') = 'full' OR
    ic_jwt_get_perm('participant_emergency') = 'full' OR
    ic_jwt_get_perm('participant_clinical_trackers') = 'full' OR
    ((
        ic_jwt_get_perm('participants') = 'context_read_write' OR
        ic_jwt_get_perm('participant_behaviour') = 'context_read_write' OR
        ic_jwt_get_perm('participant_support_needs') = 'context_read_write' OR
        ic_jwt_get_perm('participant_mealtime') = 'context_read_write' OR
        ic_jwt_get_perm('participant_medical_routine') = 'context_read_write' OR
        ic_jwt_get_perm('participant_emergency') = 'context_read_write' OR
        ic_jwt_get_perm('participant_clinical_trackers') = 'context_read_write'
    ) AND ic_jwt_has_house(house_id))
);

COMMIT;

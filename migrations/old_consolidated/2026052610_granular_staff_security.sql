-- Migration: Granular Staff Security RBAC
-- Date: 2026-05-26
-- Description: Adds 10 granular permission columns for staff profiles and UPDATES RLS policies to enforce them at the data layer.

BEGIN;

-- 1. Add new columns to ic_role_permissions
ALTER TABLE public.ic_role_permissions 
ADD COLUMN staff_employment ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_availability ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_emergency ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_compliance ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_training ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_documents ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_roster ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_leave ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_warnings ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN staff_activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum;

-- 2. Update ic_jwt_get_perm function to include new modules
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) RETURNS text AS $$
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
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      WHEN 'participants' THEN participants::text
      WHEN 'participant_goals' THEN participant_goals::text
      WHEN 'participant_behaviour' THEN participant_behaviour::text
      WHEN 'participant_support_needs' THEN participant_support_needs::text
      WHEN 'participant_mealtime' THEN participant_mealtime::text
      WHEN 'participant_medical_routine' THEN participant_medical_routine::text
      WHEN 'participant_medications' THEN participant_medications::text
      WHEN 'participant_emergency' THEN participant_emergency::text
      WHEN 'participant_contacts' THEN participant_contacts::text
      WHEN 'participant_documents' THEN participant_documents::text
      WHEN 'participant_shift_notes' THEN participant_shift_notes::text
      WHEN 'participant_activity_log' THEN participant_activity_log::text
      WHEN 'shift_notes' THEN shift_notes::text
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
      WHEN 'houses' THEN houses::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'house_management' THEN house_management::text
      WHEN 'house_operations' THEN house_operations::text
      WHEN 'house_checklist_history' THEN house_checklist_history::text
      WHEN 'house_resources' THEN house_resources::text
      WHEN 'house_staff' THEN house_staff::text
      WHEN 'house_activity_log' THEN house_activity_log::text
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions rp
  JOIN public.ic_staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies to be Granular-Aware

-- ic_staff: Allow SELECT if ANY relevant permission is granted
DROP POLICY IF EXISTS "RBAC staff SELECT" ON public.ic_staff;
CREATE POLICY "RBAC staff SELECT" ON public.ic_staff FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('employees') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_employment') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_availability') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_emergency') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_compliance') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_training') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_documents') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_roster') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_leave') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('staff_warnings') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    auth.uid() = auth_user_id -- Own profile
);

-- ic_staff: Allow UPDATE if ANY relevant write permission is granted
DROP POLICY IF EXISTS "RBAC staff UPDATE" ON public.ic_staff;
CREATE POLICY "RBAC staff UPDATE" ON public.ic_staff FOR UPDATE TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('employees') = 'full' OR
    ic_jwt_get_perm('staff_employment') = 'full' OR
    ic_jwt_get_perm('staff_availability') = 'full' OR
    ic_jwt_get_perm('staff_emergency') = 'full' OR
    ic_jwt_get_perm('staff_compliance') = 'full' OR
    ((
        ic_jwt_get_perm('employees') = 'context_read_write' OR
        ic_jwt_get_perm('staff_employment') = 'context_read_write' OR
        ic_jwt_get_perm('staff_availability') = 'context_read_write' OR
        ic_jwt_get_perm('staff_emergency') = 'context_read_write' OR
        ic_jwt_get_perm('staff_compliance') = 'context_read_write'
    ) AND ic_jwt_manages_staff(id)) OR
    auth.uid() = auth_user_id -- Own profile (typically limited in UI)
);

-- ic_staff_compliance: Check staff_compliance
DROP POLICY IF EXISTS "RBAC staff_compliance SELECT" ON public.ic_staff_compliance;
CREATE POLICY "RBAC staff_compliance SELECT" ON public.ic_staff_compliance FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_compliance') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('staff_compliance') IN ('context_read_write', 'context_read_only')) AND ic_jwt_manages_staff(staff_id)) OR
    ic_jwt_get_staff_id() = staff_id
);

DROP POLICY IF EXISTS "RBAC staff_compliance ALL" ON public.ic_staff_compliance;
CREATE POLICY "RBAC staff_compliance ALL" ON public.ic_staff_compliance FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_compliance') = 'full' OR 
    ((ic_jwt_get_perm('staff_compliance') = 'context_read_write') AND ic_jwt_manages_staff(staff_id))
);

-- ic_staff_training: Check staff_training
DROP POLICY IF EXISTS "RBAC staff_training SELECT" ON public.ic_staff_training;
CREATE POLICY "RBAC staff_training SELECT" ON public.ic_staff_training FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_training') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('staff_training') IN ('context_read_write', 'context_read_only')) AND ic_jwt_manages_staff(staff_id)) OR
    ic_jwt_get_staff_id() = staff_id
);

DROP POLICY IF EXISTS "RBAC staff_training ALL" ON public.ic_staff_training;
CREATE POLICY "RBAC staff_training ALL" ON public.ic_staff_training FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_training') = 'full' OR 
    ((ic_jwt_get_perm('staff_training') = 'context_read_write') AND ic_jwt_manages_staff(staff_id))
);

-- ic_staff_documents: Check staff_documents
DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON public.ic_staff_documents;
CREATE POLICY "RBAC staff_documents SELECT" ON public.ic_staff_documents FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_documents') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('staff_documents') IN ('context_read_write', 'context_read_only')) AND ic_jwt_manages_staff(staff_id)) OR
    ic_jwt_get_staff_id() = staff_id
);

DROP POLICY IF EXISTS "RBAC staff_documents ALL" ON public.ic_staff_documents;
CREATE POLICY "RBAC staff_documents ALL" ON public.ic_staff_documents FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_documents') = 'full' OR 
    ((ic_jwt_get_perm('staff_documents') = 'context_read_write') AND ic_jwt_manages_staff(staff_id))
);

-- ic_staff_shifts: Check staff_roster (Detail page context)
DROP POLICY IF EXISTS "RBAC staff_shifts SELECT" ON public.ic_staff_shifts;
CREATE POLICY "RBAC staff_shifts SELECT" ON public.ic_staff_shifts FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_roster') IN ('full', 'read_only') OR 
    ic_jwt_get_perm('roster_board') IN ('full', 'read_only') OR
    ((ic_jwt_get_perm('staff_roster') IN ('context_read_write', 'context_read_only')) AND ic_jwt_manages_staff(staff_id)) OR
    ic_jwt_get_staff_id() = staff_id
);

-- ic_leave_requests: Check staff_leave (Detail page context)
DROP POLICY IF EXISTS "RBAC leave_requests SELECT" ON public.ic_leave_requests;
CREATE POLICY "RBAC leave_requests SELECT" ON public.ic_leave_requests FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('staff_leave') IN ('full', 'read_only') OR 
    ic_jwt_get_perm('leave_requests') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ((ic_jwt_get_perm('staff_leave') IN ('context_read_write', 'context_read_only')) AND ic_jwt_manages_staff(staff_id)) OR
    ic_jwt_get_staff_id() = staff_id
);

-- ic_activity_log: Update Staff Context policy to check staff_activity_log
DROP POLICY IF EXISTS "RBAC Activity Log - Staff Context" ON public.ic_activity_log;
CREATE POLICY "RBAC Activity Log - Staff Context" ON public.ic_activity_log FOR SELECT TO public USING (
    (
        (entity_type = ANY (ARRAY['staff', 'employee'])) OR 
        (entity_type ~~ 'staff_%')
    ) AND (
        ic_jwt_is_admin() OR
        ic_jwt_get_perm('employees') IN ('context_read', 'context_read_write', 'full') OR
        ic_jwt_get_perm('staff_activity_log') IN ('context_read', 'context_read_write', 'full') OR
        entity_id = (ic_jwt_get_staff_id())::text
    )
);

-- 4. Storage Security
-- Allow access to ic_staff_documents bucket if user has staff_documents perm
DROP POLICY IF EXISTS "RBAC storage staff_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC storage staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'ic_staff_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('staff_documents') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
        (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text)
    )
);

DROP POLICY IF EXISTS "RBAC storage staff_documents ALL" ON storage.objects;
CREATE POLICY "RBAC storage staff_documents ALL" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'ic_staff_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('staff_documents') IN ('full', 'context_read_write') OR
        (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text)
    )
);

-- Allow access to ic_staff_photos bucket
DROP POLICY IF EXISTS "RBAC storage staff_photos SELECT" ON storage.objects;
CREATE POLICY "RBAC storage staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'ic_staff_photos' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('employees') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
        (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text)
    )
);

DROP POLICY IF EXISTS "RBAC storage staff_photos ALL" ON storage.objects;
CREATE POLICY "RBAC storage staff_photos ALL" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'ic_staff_photos' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('employees') IN ('full', 'context_read_write') OR
        (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text)
    )
);

COMMIT;

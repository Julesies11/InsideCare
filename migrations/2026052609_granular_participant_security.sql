-- Migration: Granular Participant Security RBAC
-- Date: 2026-05-26
-- Description: Adds 11 granular permission columns for participants and UPDATES RLS policies to enforce them at the data layer.

BEGIN;

-- 1. Add new columns to ic_role_permissions 
ALTER TABLE public.ic_role_permissions 
ADD COLUMN participant_goals ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_behaviour ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_support_needs ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_mealtime ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_medical_routine ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_medications ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_emergency ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_contacts ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_documents ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_shift_notes ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
ADD COLUMN participant_activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum;

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
      WHEN 'shift_notes' THEN shift_notes::text
      WHEN 'employees' THEN employees::text
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

-- ic_participants: Allow SELECT if ANY relevant permission is granted
DROP POLICY IF EXISTS "RBAC participants SELECT" ON public.ic_participants;
CREATE POLICY "RBAC participants SELECT" ON public.ic_participants FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participants') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_goals') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_behaviour') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_support_needs') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_mealtime') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_medical_routine') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_medications') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_emergency') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_contacts') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_documents') IN ('full', 'read_only', 'context_read_write', 'context_read_only') OR
    ic_jwt_get_perm('participant_shift_notes') IN ('full', 'read_only', 'context_read_write', 'context_read_only')
);

-- ic_participants: Allow UPDATE if ANY relevant write permission is granted
DROP POLICY IF EXISTS "RBAC participants UPDATE" ON public.ic_participants;
CREATE POLICY "RBAC participants UPDATE" ON public.ic_participants FOR UPDATE TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participants') = 'full' OR
    ic_jwt_get_perm('participant_behaviour') = 'full' OR
    ic_jwt_get_perm('participant_support_needs') = 'full' OR
    ic_jwt_get_perm('participant_mealtime') = 'full' OR
    ic_jwt_get_perm('participant_medical_routine') = 'full' OR
    ic_jwt_get_perm('participant_emergency') = 'full' OR
    ((
        ic_jwt_get_perm('participants') = 'context_read_write' OR
        ic_jwt_get_perm('participant_behaviour') = 'context_read_write' OR
        ic_jwt_get_perm('participant_support_needs') = 'context_read_write' OR
        ic_jwt_get_perm('participant_mealtime') = 'context_read_write' OR
        ic_jwt_get_perm('participant_medical_routine') = 'context_read_write' OR
        ic_jwt_get_perm('participant_emergency') = 'context_read_write'
    ) AND ic_jwt_has_house(house_id))
);

-- ic_participant_goals: Check participant_goals
DROP POLICY IF EXISTS "RBAC participant_goals ALL" ON public.ic_participant_goals;
CREATE POLICY "RBAC participant_goals ALL" ON public.ic_participant_goals FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_goals') = 'full' OR 
    ((ic_jwt_get_perm('participant_goals') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

DROP POLICY IF EXISTS "RBAC participant_goals SELECT" ON public.ic_participant_goals;
CREATE POLICY "RBAC participant_goals SELECT" ON public.ic_participant_goals FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_goals') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('participant_goals') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

-- ic_participant_medications: Check participant_medications
DROP POLICY IF EXISTS "RBAC participant_medications ALL" ON public.ic_participant_medications;
CREATE POLICY "RBAC participant_medications ALL" ON public.ic_participant_medications FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_medications') = 'full' OR 
    ((ic_jwt_get_perm('participant_medications') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

DROP POLICY IF EXISTS "RBAC participant_medications SELECT" ON public.ic_participant_medications;
CREATE POLICY "RBAC participant_medications SELECT" ON public.ic_participant_medications FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_medications') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('participant_medications') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

-- ic_participant_contacts: Check participant_contacts
DROP POLICY IF EXISTS "RBAC participant_contacts ALL" ON public.ic_participant_contacts;
CREATE POLICY "RBAC participant_contacts ALL" ON public.ic_participant_contacts FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_contacts') = 'full' OR 
    ((ic_jwt_get_perm('participant_contacts') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

DROP POLICY IF EXISTS "RBAC participant_contacts SELECT" ON public.ic_participant_contacts;
CREATE POLICY "RBAC participant_contacts SELECT" ON public.ic_participant_contacts FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_contacts') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('participant_contacts') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

-- ic_participant_documents: Check participant_documents
DROP POLICY IF EXISTS "RBAC participant_documents ALL" ON public.ic_participant_documents;
CREATE POLICY "RBAC participant_documents ALL" ON public.ic_participant_documents FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_documents') = 'full' OR 
    ((ic_jwt_get_perm('participant_documents') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON public.ic_participant_documents;
CREATE POLICY "RBAC participant_documents SELECT" ON public.ic_participant_documents FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('participant_documents') IN ('full', 'read_only') OR 
    ((ic_jwt_get_perm('participant_documents') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

-- ic_shift_notes: Check participant_shift_notes OR shift_notes
DROP POLICY IF EXISTS "RBAC shift_notes SELECT" ON public.ic_shift_notes;
CREATE POLICY "RBAC shift_notes SELECT" ON public.ic_shift_notes FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('shift_notes') IN ('full', 'read_only') OR 
    ic_jwt_get_perm('participant_shift_notes') IN ('full', 'read_only') OR
    ((ic_jwt_get_perm('shift_notes') IN ('context_read_write', 'context_read_only') OR ic_jwt_get_perm('participant_shift_notes') IN ('context_read_write', 'context_read_only')) AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

DROP POLICY IF EXISTS "RBAC shift_notes ALL" ON public.ic_shift_notes;
CREATE POLICY "RBAC shift_notes ALL" ON public.ic_shift_notes FOR ALL TO authenticated USING (
    ic_jwt_is_admin() OR 
    ic_jwt_get_perm('shift_notes') = 'full' OR 
    ic_jwt_get_perm('participant_shift_notes') = 'full' OR
    ((ic_jwt_get_perm('shift_notes') = 'context_read_write' OR ic_jwt_get_perm('participant_shift_notes') = 'context_read_write') AND (EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))))
);

-- ic_activity_log: Update Participant Context policy to check participant_activity_log
DROP POLICY IF EXISTS "RBAC Activity Log - Participant Context" ON public.ic_activity_log;
CREATE POLICY "RBAC Activity Log - Participant Context" ON public.ic_activity_log FOR SELECT TO public USING (
    (
        (entity_type = ANY (ARRAY['participants', 'participant'])) OR 
        (entity_type ~~ 'participant_%') OR 
        (entity_type = 'shift_notes')
    ) AND (
        ic_jwt_get_perm('participants') IN ('context_read', 'context_read_write', 'full') OR
        ic_jwt_get_perm('participant_activity_log') IN ('context_read', 'context_read_write', 'full')
    )
);

-- 4. Storage Security (Verified)
-- Allow access to ic_participant_documents bucket if user has participant_documents perm
DROP POLICY IF EXISTS "RBAC storage participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC storage participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'ic_participant_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('participant_documents') IN ('full', 'read_only', 'context_read_write', 'context_read_only')
    )
);

DROP POLICY IF EXISTS "RBAC storage participant_documents ALL" ON storage.objects;
CREATE POLICY "RBAC storage participant_documents ALL" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'ic_participant_documents' AND (
        ic_jwt_is_admin() OR 
        ic_jwt_get_perm('participant_documents') IN ('full', 'context_read_write')
    )
);

COMMIT;

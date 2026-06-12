-- Gold Standard Consolidation: Shift Note RBAC
-- This migration removes the legacy 'shift_notes' permission column and consolidates all logic under 'participant_shift_notes'.

-- 1. Data Migration: Preserve any 'shift_notes' settings into 'participant_shift_notes' if not already set
-- We use a hierarchy check: if shift_notes is 'full', it wins. If 'context_read_write' and p_s_n is 'none', it wins.
UPDATE public.ic_role_permissions
SET participant_shift_notes = 
    CASE 
        WHEN shift_notes = 'full' THEN 'full'::public.ic_access_level_enum
        WHEN shift_notes = 'read_only' AND participant_shift_notes IN ('none', 'context_read_only') THEN 'read_only'::public.ic_access_level_enum
        WHEN shift_notes = 'context_read_write' AND participant_shift_notes = 'none' THEN 'context_read_write'::public.ic_access_level_enum
        WHEN shift_notes = 'context_read_only' AND participant_shift_notes = 'none' THEN 'context_read_only'::public.ic_access_level_enum
        ELSE participant_shift_notes
    END
WHERE shift_notes != 'none';

-- 2. Schema Cleanup: Drop the redundant column
ALTER TABLE public.ic_role_permissions DROP COLUMN IF EXISTS shift_notes;

-- 3. Policy Cleanup: Drop all existing inconsistent policies on ic_shift_notes
DROP POLICY IF EXISTS "RBAC shift_notes ALL" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes ALL (Admin)" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC shift_notes DELETE" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes INSERT" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes SELECT" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC shift_notes SELECT" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes UPDATE" ON ic_shift_notes;

-- 4. Gold Standard Policy Implementation (Single Source of Truth)

-- A. SELECT: Admin OR Global Read OR Contextual Read (House/Participant Match) OR Owner
CREATE POLICY "RBAC ic_shift_notes SELECT" ON ic_shift_notes
  FOR SELECT
  TO authenticated
  USING (
    ic_jwt_is_admin() OR
    ic_jwt_get_perm('participant_shift_notes') IN ('full', 'read_only') OR
    (
      ic_jwt_get_perm('participant_shift_notes') IN ('context_read_write', 'context_read_only') AND
      (
        ic_jwt_has_house(house_id) OR 
        EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
      )
    ) OR
    (staff_id = ic_jwt_get_staff_id()) -- Ownership access
  );

-- B. INSERT: Admin OR Contextual Write (House/Participant Match)
CREATE POLICY "RBAC ic_shift_notes INSERT" ON ic_shift_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ic_jwt_is_admin() OR
    (
      ic_jwt_get_perm('participant_shift_notes') IN ('full', 'context_read_write') AND
      (
        ic_jwt_has_house(house_id) OR 
        EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
      )
    )
  );

-- C. UPDATE: Admin OR (Owner AND Contextual Write AND House/Participant Match)
CREATE POLICY "RBAC ic_shift_notes UPDATE" ON ic_shift_notes
  FOR UPDATE
  TO authenticated
  USING (
    ic_jwt_is_admin() OR
    (
      ic_jwt_get_perm('participant_shift_notes') IN ('full', 'context_read_write') AND
      (
        ic_jwt_has_house(house_id) OR 
        EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
      ) AND
      (staff_id = ic_jwt_get_staff_id()) -- Enforce ownership for updates
    )
  )
  WITH CHECK (
    ic_jwt_is_admin() OR
    (
      ic_jwt_get_perm('participant_shift_notes') IN ('full', 'context_read_write') AND
      (
        ic_jwt_has_house(house_id) OR 
        EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
      ) AND
      (staff_id = ic_jwt_get_staff_id())
    )
  );

-- D. DELETE: Admin Only (Preserves audit integrity)
CREATE POLICY "RBAC ic_shift_notes DELETE" ON ic_shift_notes
  FOR DELETE
  TO authenticated
  USING (ic_jwt_is_admin());

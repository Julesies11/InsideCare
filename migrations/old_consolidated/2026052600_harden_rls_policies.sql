-- Migration: Harden RLS Policies & Fix Timesheet/Shift Note Access
-- Date: 2026-05-26
-- Description: Replaces broad ALL policies with granular SELECT/INSERT/UPDATE. 
--              Restricts DELETE to global Admins. Fixes 403 Forbidden on ic_timesheets.

BEGIN;

--------------------------------------------------------------------------------
-- 1. IC_TIMESHEETS (Fixes 403 Forbidden UPSERT)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC ic_timesheets ALL (Admin)" ON ic_timesheets;
DROP POLICY IF EXISTS "RBAC ic_timesheets SELECT" ON ic_timesheets;
DROP POLICY IF EXISTS "RBAC timesheets SELECT" ON ic_timesheets;

-- Admin: Full Access
CREATE POLICY "RBAC ic_timesheets ALL (Admin)" ON ic_timesheets 
FOR ALL TO authenticated USING (ic_jwt_is_admin());

-- Staff: View Own or if Manager
CREATE POLICY "RBAC ic_timesheets SELECT" ON ic_timesheets 
FOR SELECT TO authenticated 
USING (
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_get_perm('timesheets') IN ('full', 'read_only') OR
  (ic_jwt_get_perm('timesheets') = 'context_read_write' AND ic_jwt_manages_staff(staff_id))
);

-- Staff: Create/Update Own (Required for UPSERT)
CREATE POLICY "RBAC ic_timesheets INSERT" ON ic_timesheets 
FOR INSERT TO authenticated 
WITH CHECK (staff_id = ic_jwt_get_staff_id());

CREATE POLICY "RBAC ic_timesheets UPDATE" ON ic_timesheets 
FOR UPDATE TO authenticated 
USING (staff_id = ic_jwt_get_staff_id())
WITH CHECK (staff_id = ic_jwt_get_staff_id());


--------------------------------------------------------------------------------
-- 2. IC_SHIFT_NOTES (Fixes missing staff access)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC ic_shift_notes ALL (Admin)" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes SELECT" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes INSERT" ON ic_shift_notes;
DROP POLICY IF EXISTS "RBAC ic_shift_notes UPDATE" ON ic_shift_notes;

-- Admin: Full Access
CREATE POLICY "RBAC ic_shift_notes ALL (Admin)" ON ic_shift_notes 
FOR ALL TO authenticated USING (ic_jwt_is_admin());

-- Staff: Contextual Access
CREATE POLICY "RBAC ic_shift_notes SELECT" ON ic_shift_notes 
FOR SELECT TO authenticated 
USING (
  ic_jwt_is_admin() OR 
  ic_jwt_get_perm('shift_notes') IN ('full', 'read_only') OR
  (ic_jwt_get_perm('shift_notes') IN ('context_read_write', 'context_read_only') AND ic_jwt_has_house(house_id))
);

CREATE POLICY "RBAC ic_shift_notes INSERT" ON ic_shift_notes 
FOR INSERT TO authenticated 
WITH CHECK (
  ic_jwt_get_perm('shift_notes') IN ('full', 'context_read_write') AND 
  ic_jwt_has_house(house_id)
);

CREATE POLICY "RBAC ic_shift_notes UPDATE" ON ic_shift_notes 
FOR UPDATE TO authenticated 
USING (
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_is_admin()
)
WITH CHECK (
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_is_admin()
);


--------------------------------------------------------------------------------
-- 3. HARDENING: Replace ALL with SELECT/INSERT/UPDATE (Leave Requests)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC leave_requests ALL" ON ic_leave_requests;
DROP POLICY IF EXISTS "RBAC ic_leave_requests SELECT" ON ic_leave_requests;
DROP POLICY IF EXISTS "RBAC leave_requests SELECT" ON ic_leave_requests;
DROP POLICY IF EXISTS "RBAC ic_leave_requests ALL (Admin)" ON ic_leave_requests;
DROP POLICY IF EXISTS "RBAC ic_leave_requests INSERT" ON ic_leave_requests;
DROP POLICY IF EXISTS "RBAC ic_leave_requests UPDATE" ON ic_leave_requests;

CREATE POLICY "RBAC ic_leave_requests ALL (Admin)" ON ic_leave_requests 
FOR ALL TO authenticated USING (ic_jwt_is_admin());

CREATE POLICY "RBAC ic_leave_requests SELECT" ON ic_leave_requests 
FOR SELECT TO authenticated 
USING (
  staff_id = ic_jwt_get_staff_id() OR 
  ic_jwt_get_perm('leave_requests') IN ('full', 'read_only') OR
  (ic_jwt_get_perm('leave_requests') = 'context_read_write' AND ic_jwt_manages_staff(staff_id))
);

CREATE POLICY "RBAC ic_leave_requests INSERT" ON ic_leave_requests 
FOR INSERT TO authenticated 
WITH CHECK (staff_id = ic_jwt_get_staff_id());

CREATE POLICY "RBAC ic_leave_requests UPDATE" ON ic_leave_requests 
FOR UPDATE TO authenticated 
USING (staff_id = ic_jwt_get_staff_id() AND status = 'pending')
WITH CHECK (staff_id = ic_jwt_get_staff_id());


--------------------------------------------------------------------------------
-- 4. HARDENING: Clinical Notes (Enforce Admin-Only Delete)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "RBAC participant_notes ALL" ON ic_participant_notes;
DROP POLICY IF EXISTS "RBAC participant_notes SELECT" ON ic_participant_notes;
DROP POLICY IF EXISTS "RBAC ic_participant_notes ALL (Admin)" ON ic_participant_notes;
DROP POLICY IF EXISTS "RBAC ic_participant_notes INSERT" ON ic_participant_notes;
DROP POLICY IF EXISTS "RBAC ic_participant_notes UPDATE" ON ic_participant_notes;

CREATE POLICY "RBAC ic_participant_notes ALL (Admin)" ON ic_participant_notes 
FOR ALL TO authenticated USING (ic_jwt_is_admin());

CREATE POLICY "RBAC ic_participant_notes SELECT" ON ic_participant_notes 
FOR SELECT TO authenticated 
USING (
  ic_jwt_get_perm('participants') IN ('full', 'read_only') OR 
  (ic_jwt_get_perm('participants') IN ('context_read_write', 'context_read_only') AND 
   EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id)))
);

CREATE POLICY "RBAC ic_participant_notes INSERT" ON ic_participant_notes 
FOR INSERT TO authenticated 
WITH CHECK (
  ic_jwt_get_perm('participants') = 'context_read_write' AND 
  EXISTS (SELECT 1 FROM ic_participants p WHERE p.id = participant_id AND ic_jwt_has_house(p.house_id))
);

CREATE POLICY "RBAC ic_participant_notes UPDATE" ON ic_participant_notes 
FOR UPDATE TO authenticated 
USING (
  created_by = auth.uid() OR ic_jwt_is_admin()
)
WITH CHECK (
  created_by = auth.uid() OR ic_jwt_is_admin()
);

COMMIT;

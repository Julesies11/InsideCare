-- ========================================================================================
-- RBAC STATE CHANGE HARDENING 2026-05-14
-- Objective: Prevent staff from modifying critical status columns (Medications, Compliance, Funding).
-- ========================================================================================

-- 1. STAFF PROFILE HARDENING
-- Staff should not be able to change their own status or role.
DROP POLICY IF EXISTS "RBAC Staff ALL (Admin/Full)" ON public.staff;
CREATE POLICY "RBAC Staff UPDATE" ON public.staff
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    auth_user_id = auth.uid() -- Allow self-update for contact info
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        auth_user_id = auth.uid() AND
        -- Block self-elevation or status changes
        (NEW.status = OLD.status) AND
        (NEW.role_id = OLD.role_id) AND
        (NEW.manager_id = OLD.manager_id)
    )
);

-- 2. PARTICIPANT HARDENING
-- Staff should not be able to change participant status (Active/Inactive)
DROP POLICY IF EXISTS "RBAC Participants ALL (Admin/Full)" ON public.participants;
CREATE POLICY "RBAC Participants UPDATE" ON public.participants
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), public.participants.house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        -- Context-locked staff can update notes etc, but not status
        public.get_access_level('participant_profiles') = 'context_locked' AND
        (NEW.status = OLD.status)
    )
);

-- 3. CLINICAL HARDENING (Medications)
-- Only Admins or Clinical Leads (Full Access) should toggle is_active on medications.
DROP POLICY IF EXISTS "RBAC participant_medications ALL (Admin/Full)" ON public.participant_medications;
CREATE POLICY "RBAC Medications ALL" ON public.participant_medications
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
);

-- 4. COMPLIANCE HARDENING
-- Staff MUST NOT update their own compliance records.
DROP POLICY IF EXISTS "RBAC staff_compliance SELECT" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance SELECT" ON public.staff_compliance
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    public.is_staff_managed_by(staff_id, public.get_my_staff_id())
);

CREATE POLICY "RBAC Staff Compliance ALL (Admin/Full)" ON public.staff_compliance
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
);

-- 5. FUNDING HARDENING
-- Only Admin/Full can manage funding levels.
DROP POLICY IF EXISTS "RBAC participant_funding SELECT" ON public.participant_funding;
CREATE POLICY "RBAC Participant Funding SELECT" ON public.participant_funding
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), 
            (SELECT house_id FROM public.participants WHERE id = public.participant_funding.participant_id)
        )
    )
);

DROP POLICY IF EXISTS "RBAC participant_funding ALL (Admin/Full)" ON public.participant_funding;
CREATE POLICY "RBAC Participant Funding ALL (Admin/Full)" ON public.participant_funding
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
);

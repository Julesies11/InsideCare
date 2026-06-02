-- Migration: 2026053000_fix_shift_templates_rbac.sql
-- Description: Adds missing RLS policies for ic_house_shift_templates, ic_shift_template_default_checklists and other master lists
--              Also fixes ic_timesheets update policy for admins/managers and prevents self-approval.
-- Verified by: Gemini CLI Senior Engineer & Security Researcher

BEGIN;

-- ===============================================================
-- 1. Operational Tables (House Specific)
-- ===============================================================

-- ic_house_shift_templates
ALTER TABLE public.ic_house_shift_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RBAC house_shift_templates INSERT" ON public.ic_house_shift_templates;
CREATE POLICY "RBAC house_shift_templates INSERT" ON public.ic_house_shift_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
        ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(house_id))
    );

DROP POLICY IF EXISTS "RBAC house_shift_templates UPDATE" ON public.ic_house_shift_templates;
CREATE POLICY "RBAC house_shift_templates UPDATE" ON public.ic_house_shift_templates
    FOR UPDATE TO authenticated
    USING (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
        ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(house_id))
    )
    WITH CHECK (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
        ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(house_id))
    );

DROP POLICY IF EXISTS "RBAC house_shift_templates SELECT" ON public.ic_house_shift_templates;
CREATE POLICY "RBAC house_shift_templates SELECT" ON public.ic_house_shift_templates
    FOR SELECT TO authenticated
    USING (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('master_lists'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR
        (ic_jwt_get_perm('house_checklists'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR
        ((ic_jwt_get_perm('house_checklists'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND ic_jwt_has_house(house_id))
    );

DROP POLICY IF EXISTS "RBAC house_shift_templates DELETE" ON public.ic_house_shift_templates;
CREATE POLICY "RBAC house_shift_templates DELETE" ON public.ic_house_shift_templates
    FOR DELETE TO authenticated
    USING (ic_jwt_is_admin());

-- ic_shift_template_default_checklists
ALTER TABLE public.ic_shift_template_default_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RBAC shift_template_default_checklists INSERT" ON public.ic_shift_template_default_checklists;
CREATE POLICY "RBAC shift_template_default_checklists INSERT" ON public.ic_shift_template_default_checklists
    FOR INSERT TO authenticated
    WITH CHECK (
        ic_jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM ic_house_shift_templates st
            WHERE st.id = ic_shift_template_default_checklists.shift_template_id
            AND (
                (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
                ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(st.house_id))
            )
        )
    );

DROP POLICY IF EXISTS "RBAC shift_template_default_checklists UPDATE" ON public.ic_shift_template_default_checklists;
CREATE POLICY "RBAC shift_template_default_checklists UPDATE" ON public.ic_shift_template_default_checklists
    FOR UPDATE TO authenticated
    USING (
        ic_jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM ic_house_shift_templates st
            WHERE st.id = ic_shift_template_default_checklists.shift_template_id
            AND (
                (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
                ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(st.house_id))
            )
        )
    )
    WITH CHECK (
        ic_jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM ic_house_shift_templates st
            WHERE st.id = ic_shift_template_default_checklists.shift_template_id
            AND (
                (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
                ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(st.house_id))
            )
        )
    );

DROP POLICY IF EXISTS "RBAC shift_template_default_checklists SELECT" ON public.ic_shift_template_default_checklists;
CREATE POLICY "RBAC shift_template_default_checklists SELECT" ON public.ic_shift_template_default_checklists
    FOR SELECT TO authenticated
    USING (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('master_lists'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR
        EXISTS (
            SELECT 1 FROM ic_house_shift_templates st
            WHERE st.id = ic_shift_template_default_checklists.shift_template_id
            AND (
                (ic_jwt_get_perm('house_checklists'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR
                ((ic_jwt_get_perm('house_checklists'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND ic_jwt_has_house(st.house_id))
            )
        )
    );

DROP POLICY IF EXISTS "RBAC shift_template_default_checklists DELETE" ON public.ic_shift_template_default_checklists;
CREATE POLICY "RBAC shift_template_default_checklists DELETE" ON public.ic_shift_template_default_checklists
    FOR DELETE TO authenticated
    USING (
        ic_jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM ic_house_shift_templates st
            WHERE st.id = ic_shift_template_default_checklists.shift_template_id
            AND (
                (ic_jwt_get_perm('house_checklists'::text) = 'full'::text) OR 
                ((ic_jwt_get_perm('house_checklists'::text) = 'context_read_write'::text) AND ic_jwt_has_house(st.house_id))
            )
        )
    );

-- ===============================================================
-- 2. ic_timesheets (Harden Admin/Manager update + Self-Approval Block)
-- ===============================================================

DROP POLICY IF EXISTS "RBAC ic_timesheets UPDATE" ON public.ic_timesheets;
CREATE POLICY "RBAC ic_timesheets UPDATE" ON public.ic_timesheets
    FOR UPDATE TO authenticated
    USING (
        ic_jwt_is_admin() OR 
        (staff_id = ic_jwt_get_staff_id()) OR 
        (ic_jwt_get_perm('timesheets'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text]))
    )
    WITH CHECK (
        ic_jwt_is_admin() OR 
        (ic_jwt_get_perm('timesheets'::text) = 'full'::text) OR 
        ((ic_jwt_get_perm('timesheets'::text) = 'context_read_write'::text) AND ic_jwt_manages_staff(staff_id)) OR
        (staff_id = ic_jwt_get_staff_id() AND status = ANY (ARRAY['pending'::text, 'draft'::text]))
    );


-- ===============================================================
-- 3. Master Lists (Organization Wide)
-- ===============================================================

-- ic_house_calendar_event_types_master
DROP POLICY IF EXISTS "RBAC ic_house_calendar_event_types_master SELECT" ON public.ic_house_calendar_event_types_master;
CREATE POLICY "RBAC ic_house_calendar_event_types_master SELECT" ON public.ic_house_calendar_event_types_master 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC ic_house_calendar_event_types_master INSERT" ON public.ic_house_calendar_event_types_master;
CREATE POLICY "RBAC ic_house_calendar_event_types_master INSERT" ON public.ic_house_calendar_event_types_master
    FOR INSERT TO authenticated
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC ic_house_calendar_event_types_master UPDATE" ON public.ic_house_calendar_event_types_master;
CREATE POLICY "RBAC ic_house_calendar_event_types_master UPDATE" ON public.ic_house_calendar_event_types_master
    FOR UPDATE TO authenticated
    USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text))
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

-- ic_seizure_types_master
DROP POLICY IF EXISTS "RBAC seizure_types SELECT" ON public.ic_seizure_types_master;
CREATE POLICY "RBAC seizure_types SELECT" ON public.ic_seizure_types_master 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC seizure_types ALL (Admin)" ON public.ic_seizure_types_master;
DROP POLICY IF EXISTS "RBAC seizure_types INSERT" ON public.ic_seizure_types_master;
CREATE POLICY "RBAC seizure_types INSERT" ON public.ic_seizure_types_master
    FOR INSERT TO authenticated
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC seizure_types UPDATE" ON public.ic_seizure_types_master;
CREATE POLICY "RBAC seizure_types UPDATE" ON public.ic_seizure_types_master
    FOR UPDATE TO authenticated
    USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text))
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC seizure_types DELETE" ON public.ic_seizure_types_master;
CREATE POLICY "RBAC seizure_types DELETE" ON public.ic_seizure_types_master
    FOR DELETE TO authenticated
    USING (ic_jwt_is_admin());

-- ic_behaviour_types_master
DROP POLICY IF EXISTS "RBAC behaviour_types SELECT" ON public.ic_behaviour_types_master;
CREATE POLICY "RBAC behaviour_types SELECT" ON public.ic_behaviour_types_master 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC behaviour_types ALL (Admin)" ON public.ic_behaviour_types_master;
DROP POLICY IF EXISTS "RBAC behaviour_types INSERT" ON public.ic_behaviour_types_master;
CREATE POLICY "RBAC behaviour_types INSERT" ON public.ic_behaviour_types_master
    FOR INSERT TO authenticated
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC behaviour_types UPDATE" ON public.ic_behaviour_types_master;
CREATE POLICY "RBAC behaviour_types UPDATE" ON public.ic_behaviour_types_master
    FOR UPDATE TO authenticated
    USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text))
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC behaviour_types DELETE" ON public.ic_behaviour_types_master;
CREATE POLICY "RBAC behaviour_types DELETE" ON public.ic_behaviour_types_master
    FOR DELETE TO authenticated
    USING (ic_jwt_is_admin());

-- ic_leave_types
DROP POLICY IF EXISTS "RBAC leave_types SELECT" ON public.ic_leave_types;
CREATE POLICY "RBAC leave_types SELECT" ON public.ic_leave_types 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC leave_types ALL (Admin)" ON public.ic_leave_types;
DROP POLICY IF EXISTS "RBAC leave_types INSERT" ON public.ic_leave_types;
CREATE POLICY "RBAC leave_types INSERT" ON public.ic_leave_types
    FOR INSERT TO authenticated
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC leave_types UPDATE" ON public.ic_leave_types;
CREATE POLICY "RBAC leave_types UPDATE" ON public.ic_leave_types
    FOR UPDATE TO authenticated
    USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text))
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC leave_types DELETE" ON public.ic_leave_types;
CREATE POLICY "RBAC leave_types DELETE" ON public.ic_leave_types
    FOR DELETE TO authenticated
    USING (ic_jwt_is_admin());

-- ic_medications_master
DROP POLICY IF EXISTS "RBAC medications_master SELECT" ON public.ic_medications_master;
CREATE POLICY "RBAC medications_master SELECT" ON public.ic_medications_master 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "RBAC medications_master ALL (Admin)" ON public.ic_medications_master;
DROP POLICY IF EXISTS "RBAC medications_master INSERT" ON public.ic_medications_master;
CREATE POLICY "RBAC medications_master INSERT" ON public.ic_medications_master
    FOR INSERT TO authenticated
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC medications_master UPDATE" ON public.ic_medications_master;
CREATE POLICY "RBAC medications_master UPDATE" ON public.ic_medications_master
    FOR UPDATE TO authenticated
    USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text))
    WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists'::text) = 'full'::text));

DROP POLICY IF EXISTS "RBAC medications_master DELETE" ON public.ic_medications_master;
CREATE POLICY "RBAC medications_master DELETE" ON public.ic_medications_master
    FOR DELETE TO authenticated
    USING (ic_jwt_is_admin());

COMMIT;

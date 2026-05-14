-- ========================================================================================
-- RBAC RLS HARDENING - CHECKLIST SECRECY 2026-05-15
-- Objective: Tighten overly permissive RLS policies on checklist-related tables.
-- ========================================================================================

-- 1. CLEANUP PERMISSIVE POLICIES
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC Checklist Submission Items SELECT" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments;
DROP POLICY IF EXISTS "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments;

-- 2. SECURE HOUSE CHECKLIST ITEMS
-- Users can only see checklist items for houses they have access to.
CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklists hc
        WHERE hc.id = public.house_checklist_items.checklist_id
        AND (
            public.get_access_level('house_checklists') IN ('full', 'read_only') OR
            (
                public.get_access_level('house_checklists') = 'context_locked' AND
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = public.get_my_staff_id()
                    AND hsa.house_id = hc.house_id
                    AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                )
            )
        )
    )
);

-- 3. SECURE CHECKLIST SUBMISSION ITEMS
-- Users can only see submission items for houses they have access to.
CREATE POLICY "RBAC Checklist Submission Items SELECT" ON public.house_checklist_submission_items
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('house_checklists') IN ('full', 'read_only') OR
            public.get_access_level('shift_routines') IN ('full', 'read_only') OR
            (
                (public.get_access_level('house_checklists') = 'context_locked' OR public.get_access_level('shift_routines') = 'context_locked') AND
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = public.get_my_staff_id()
                    AND hsa.house_id = hcs.house_id
                    AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                )
            )
        )
    )
);

-- Users can only update submission items for houses they are assigned to and have 'full' or 'context_locked' shift_routines access.
CREATE POLICY "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('shift_routines') = 'full' OR
            (
                public.get_access_level('shift_routines') = 'context_locked' AND
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = public.get_my_staff_id()
                    AND hsa.house_id = hcs.house_id
                    AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                )
            )
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('shift_routines') = 'full' OR
            (
                public.get_access_level('shift_routines') = 'context_locked' AND
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = public.get_my_staff_id()
                    AND hsa.house_id = hcs.house_id
                    AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                )
            )
        )
    )
);

-- 4. SECURE CHECKLIST ITEM ATTACHMENTS
-- Users can only see attachments for houses they have access to.
CREATE POLICY "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_item_attachments.submission_id
        AND (
            public.get_access_level('house_checklists') IN ('full', 'read_only') OR
            public.get_access_level('shift_routines') IN ('full', 'read_only') OR
            (
                (public.get_access_level('house_checklists') = 'context_locked' OR public.get_access_level('shift_routines') = 'context_locked') AND
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = public.get_my_staff_id()
                    AND hsa.house_id = hcs.house_id
                    AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                )
            )
        )
    )
);

-- Users can only insert attachments for houses they are assigned to.
CREATE POLICY "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_item_attachments.submission_id
        AND (
            public.get_access_level('shift_routines') = 'full' OR
            (
                public.get_access_level('shift_routines') = 'context_locked' AND
                EXISTS (
                    SELECT 1 FROM public.house_staff_assignments hsa
                    WHERE hsa.staff_id = public.get_my_staff_id()
                    AND hsa.house_id = hcs.house_id
                    AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                )
            )
        )
    )
);

-- Migration: RLS Audit Cleanup and Storage Fixes
-- Date: 2026-05-19
-- Description: Drops deprecated funding tables, fixes missing 'full' permission overrides, and corrects storage RLS logical errors.

-- 1. DROP DEPRECATED TABLES
DROP TABLE IF EXISTS public.funding_claims CASCADE;
DROP TABLE IF EXISTS public.funding_invoices CASCADE;

-- 2. FIX OPERATIONAL TABLE PERMISSIONS (Missing 'full' overrides)

-- house_calendar_events
DROP POLICY IF EXISTS "RBAC house_calendar_events ALL" ON public.house_calendar_events;
CREATE POLICY "RBAC house_calendar_events ALL" ON public.house_calendar_events FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND jwt_has_house(house_id))
);

-- house_comms
DROP POLICY IF EXISTS "RBAC house_comms ALL" ON public.house_comms;
CREATE POLICY "RBAC house_comms ALL" ON public.house_comms FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND jwt_has_house(house_id))
);

-- house_forms
DROP POLICY IF EXISTS "RBAC house_forms ALL" ON public.house_forms;
CREATE POLICY "RBAC house_forms ALL" ON public.house_forms FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND jwt_has_house(house_id))
);

-- house_form_assignments
DROP POLICY IF EXISTS "RBAC house_form_assignments ALL" ON public.house_form_assignments;
CREATE POLICY "RBAC house_form_assignments ALL" ON public.house_form_assignments FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND jwt_has_house(hf.house_id)
    ))
);

-- house_form_submissions
DROP POLICY IF EXISTS "RBAC house_form_submissions ALL" ON public.house_form_submissions;
CREATE POLICY "RBAC house_form_submissions ALL" ON public.house_form_submissions FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('houses') = 'full' OR
    (jwt_get_perm('houses') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM house_forms hf WHERE hf.id = form_id AND jwt_has_house(hf.house_id)
    ))
);

-- shift_assigned_checklists
DROP POLICY IF EXISTS "RBAC shift_assigned_checklists ALL" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC shift_assigned_checklists ALL" ON public.shift_assigned_checklists FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    jwt_get_perm('roster_board') = 'full' OR
    (jwt_get_perm('roster_board') = 'context_read_write' AND EXISTS (
        SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_id AND jwt_has_house(ss.house_id)
    ))
);

-- shift_notes
DROP POLICY IF EXISTS "RBAC shift_notes ALL" ON public.shift_notes;
CREATE POLICY "RBAC shift_notes ALL" ON public.shift_notes FOR ALL TO authenticated
USING (
    jwt_is_admin() OR 
    staff_id = jwt_get_staff_id() OR 
    jwt_get_perm('shift_notes') = 'full' OR
    (jwt_get_perm('shift_notes') = 'context_read_write' AND (
        jwt_manages_staff(staff_id) OR jwt_has_house(house_id)
    ))
);

-- 3. FIX STAFF VISIBILITY (Standard staff can see house coworkers)
DROP POLICY IF EXISTS "RBAC staff SELECT" ON public.staff;
CREATE POLICY "RBAC staff SELECT" ON public.staff FOR SELECT TO authenticated
USING (
    jwt_is_admin() OR 
    auth_user_id = auth.uid() OR 
    jwt_get_perm('employees') IN ('full', 'read_only') OR 
    jwt_manages_staff(id) OR
    EXISTS (
        SELECT 1 FROM house_staff_assignments hsa 
        WHERE hsa.staff_id = staff.id 
        AND jwt_has_house(hsa.house_id) 
        AND (hsa.end_date IS NULL OR hsa.end_date > now())
    )
);

-- 4. FIX STORAGE RLS POLICIES (Correcting path parsing and logic errors)

-- branch-documents
DROP POLICY IF EXISTS "RBAC branch_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'branch-documents' AND 
    jwt_is_admin() OR 
    EXISTS (
        SELECT 1 FROM houses h 
        WHERE h.branch_id::text = split_part(name, '/', 1) 
        AND jwt_has_house(h.id)
    )
);

-- checklist-attachments
DROP POLICY IF EXISTS "RBAC checklist_attachments INSERT" ON storage.objects;
CREATE POLICY "RBAC checklist_attachments INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'checklist-attachments' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM house_checklist_submissions hcs 
            WHERE hcs.id::text = split_part(name, '/', 1) 
            AND jwt_has_house(hcs.house_id) 
            AND jwt_get_perm('house_checklists') IN ('full', 'context_read_write')
        )
    )
);

DROP POLICY IF EXISTS "RBAC checklist_attachments SELECT" ON storage.objects;
CREATE POLICY "RBAC checklist_attachments SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'checklist-attachments' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM house_checklist_submissions hcs 
            WHERE hcs.id::text = split_part(name, '/', 1) 
            AND jwt_has_house(hcs.house_id)
        )
    )
);

-- house-documents
DROP POLICY IF EXISTS "RBAC house_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC house_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'house-documents' AND (
        jwt_is_admin() OR (
            jwt_has_house(split_part(name, '/', 1)::uuid) AND 
            jwt_get_perm('houses') IN ('full', 'context_read_write')
        )
    )
);

DROP POLICY IF EXISTS "RBAC house_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC house_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'house-documents' AND (
        jwt_is_admin() OR 
        jwt_has_house(split_part(name, '/', 1)::uuid) OR
        jwt_get_perm('houses') IN ('full', 'read_only')
    )
);

-- participant-documents (Fixed from broken photo_url logic)
DROP POLICY IF EXISTS "RBAC participant_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(name, '/', 1) 
            AND jwt_has_house(p.house_id) 
            AND jwt_get_perm('participants') IN ('full', 'context_read_write')
        )
    )
);

DROP POLICY IF EXISTS "RBAC participant_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'participant-documents' AND (
        jwt_is_admin() OR 
        EXISTS (
            SELECT 1 FROM participants p 
            WHERE p.id::text = split_part(name, '/', 1) 
            AND (jwt_has_house(p.house_id) OR jwt_get_perm('participants') IN ('full', 'read_only'))
        )
    )
);

-- staff-documents (Fixed from broken photo_url logic)
DROP POLICY IF EXISTS "RBAC staff_documents INSERT" ON storage.objects;
CREATE POLICY "RBAC staff_documents INSERT" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'staff-documents' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') = 'full'
    )
);

DROP POLICY IF EXISTS "RBAC staff_documents SELECT" ON storage.objects;
CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'staff-documents' AND (
        jwt_is_admin() OR 
        split_part(name, '/', 1) = jwt_get_staff_id()::text OR 
        jwt_get_perm('employees') IN ('full', 'read_only') OR 
        jwt_manages_staff(split_part(name, '/', 1)::uuid)
    )
);

-- Cleanup redundant/conflicting 'participants' bucket policies if they exist
DROP POLICY IF EXISTS "RBAC participants_bucket SELECT" ON storage.objects;

-- Create a new migration to lock completed checklists using RLS policies

DO $$ 
BEGIN

    -- 1. Submissions Table
    -- Drop the broad "Staff manage assigned submissions" policy
    DROP POLICY IF EXISTS "Staff manage assigned submissions" ON public.house_checklist_submissions;

    -- Re-create separate policies for Staff: SELECT, INSERT, and UPDATE
    
    -- Staff can view submissions for their assigned houses
    CREATE POLICY "Staff select assigned submissions" 
    ON public.house_checklist_submissions 
    FOR SELECT TO authenticated 
    USING (house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

    -- Staff can insert new submissions for their assigned houses
    CREATE POLICY "Staff insert assigned submissions" 
    ON public.house_checklist_submissions 
    FOR INSERT TO authenticated 
    WITH CHECK (house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

    -- Staff can update submissions ONLY if the status is currently 'in_progress'
    -- We check the old row's status to ensure they can't update an already 'completed' one.
    CREATE POLICY "Staff update assigned submissions" 
    ON public.house_checklist_submissions 
    FOR UPDATE TO authenticated 
    USING (
        house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
        AND status = 'in_progress'
    )
    WITH CHECK (
        house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
    );

    -- Staff can only delete in_progress submissions (if you allow deleting drafts)
    CREATE POLICY "Staff delete assigned submissions" 
    ON public.house_checklist_submissions 
    FOR DELETE TO authenticated 
    USING (
        house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
        AND status = 'in_progress'
    );


    -- 2. Submission Items Table
    -- Drop the broad policy
    DROP POLICY IF EXISTS "Staff manage assigned submission items" ON public.house_checklist_submission_items;

    CREATE POLICY "Staff select assigned submission items" 
    ON public.house_checklist_submission_items 
    FOR SELECT TO authenticated 
    USING (submission_id IN (SELECT id FROM house_checklist_submissions WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

    CREATE POLICY "Staff insert assigned submission items" 
    ON public.house_checklist_submission_items 
    FOR INSERT TO authenticated 
    WITH CHECK (
        submission_id IN (
            SELECT id FROM house_checklist_submissions 
            WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
            AND status = 'in_progress'
        )
    );

    CREATE POLICY "Staff update assigned submission items" 
    ON public.house_checklist_submission_items 
    FOR UPDATE TO authenticated 
    USING (
        submission_id IN (
            SELECT id FROM house_checklist_submissions 
            WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
            AND status = 'in_progress'
        )
    )
    WITH CHECK (
        submission_id IN (SELECT id FROM house_checklist_submissions WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()))
    );


    -- 3. Item Attachments Table
    -- Drop the broad policy
    DROP POLICY IF EXISTS "Staff manage assigned attachments" ON public.house_checklist_item_attachments;

    CREATE POLICY "Staff select assigned attachments" 
    ON public.house_checklist_item_attachments 
    FOR SELECT TO authenticated 
    USING (submission_id IN (SELECT id FROM house_checklist_submissions WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

    CREATE POLICY "Staff insert assigned attachments" 
    ON public.house_checklist_item_attachments 
    FOR INSERT TO authenticated 
    WITH CHECK (
        submission_id IN (
            SELECT id FROM house_checklist_submissions 
            WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
            AND status = 'in_progress'
        )
    );

    CREATE POLICY "Staff delete assigned attachments" 
    ON public.house_checklist_item_attachments 
    FOR DELETE TO authenticated 
    USING (
        submission_id IN (
            SELECT id FROM house_checklist_submissions 
            WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())
            AND status = 'in_progress'
        )
    );

END $$;

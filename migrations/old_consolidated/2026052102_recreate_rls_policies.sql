-- Migration: Recreate all RLS policies for prefixed schema
-- Date: 2026-05-21
-- Description: Recreates all RLS policies for the newly refactored schema with 'ic_' prefixes.
-- Targets: All public.ic_* tables and storage.objects for ic_* buckets.

BEGIN;

-- ==========================================
-- 1. CLEANUP EXISTING POLICIES
-- ==========================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Clean up all existing policies on ic_ tables in public schema
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'ic_%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
    
    -- Clean up storage policies targeting ic_ buckets or general storage
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- ==========================================
-- 2. ENABLE RLS FOR ALL IC_ TABLES
-- ==========================================
DO $$
DECLARE
    tab RECORD;
BEGIN
    FOR tab IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'ic_%')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tab.tablename);
    END LOOP;
END $$;

-- ==========================================
-- 3. RECREATE PUBLIC TABLE POLICIES (FROM JSON)
-- ==========================================

-- ic_activity_log
CREATE POLICY "RBAC activity_log ALL (Admin)" ON public.ic_activity_log FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC activity_log INSERT" ON public.ic_activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "RBAC activity_log SELECT" ON public.ic_activity_log FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('activity_log') = 'full'));

-- ic_branch_policies
CREATE POLICY "RBAC branch_policies ALL" ON public.ic_branch_policies FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = 'full'));
CREATE POLICY "RBAC branch_policies SELECT" ON public.ic_branch_policies FOR SELECT TO authenticated USING (true);

-- ic_branches
CREATE POLICY "RBAC branches ALL" ON public.ic_branches FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = 'full'));
CREATE POLICY "RBAC branches SELECT" ON public.ic_branches FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_checklist_item_master
CREATE POLICY "RBAC checklist_item_master DELETE" ON public.ic_checklist_item_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC checklist_item_master SELECT" ON public.ic_checklist_item_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_checklist_master
CREATE POLICY "RBAC checklist_master DELETE" ON public.ic_checklist_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC checklist_master SELECT" ON public.ic_checklist_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_checklist_schedules
CREATE POLICY "RBAC checklist_schedules ALL" ON public.ic_checklist_schedules FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC checklist_schedules SELECT" ON public.ic_checklist_schedules FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_has_house(house_id) OR (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'read_only'])));

-- ic_contact_types_master
CREATE POLICY "RBAC contact_types_master DELETE" ON public.ic_contact_types_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC contact_types_master SELECT" ON public.ic_contact_types_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_departments
CREATE POLICY "RBAC departments ALL" ON public.ic_departments FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = 'full'));
CREATE POLICY "RBAC departments SELECT" ON public.ic_departments FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_employment_types_master
CREATE POLICY "RBAC employment_types_master DELETE" ON public.ic_employment_types_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC employment_types_master SELECT" ON public.ic_employment_types_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_error_logs
CREATE POLICY "RBAC error_logs ALL" ON public.ic_error_logs FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC error_logs INSERT" ON public.ic_error_logs FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));

-- ic_funding_sources_master
CREATE POLICY "RBAC funding_sources_master DELETE" ON public.ic_funding_sources_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC funding_sources_master SELECT" ON public.ic_funding_sources_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_funding_types_master
CREATE POLICY "RBAC funding_types_master DELETE" ON public.ic_funding_types_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC funding_types_master SELECT" ON public.ic_funding_types_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_calendar_event_attachments
CREATE POLICY "RBAC house_calendar_event_attachments ALL" ON public.ic_house_calendar_event_attachments FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_calendar_events hce WHERE ((hce.id = public.ic_house_calendar_event_attachments.event_id) AND ic_jwt_has_house(hce.house_id))))));
CREATE POLICY "RBAC house_calendar_event_attachments SELECT" ON public.ic_house_calendar_event_attachments FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_calendar_events hce WHERE ((hce.id = public.ic_house_calendar_event_attachments.event_id) AND (ic_jwt_has_house(hce.house_id) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])))))));

-- ic_house_calendar_event_participants
CREATE POLICY "RBAC house_calendar_event_participants ALL" ON public.ic_house_calendar_event_participants FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_calendar_events hce WHERE ((hce.id = public.ic_house_calendar_event_participants.event_id) AND ic_jwt_has_house(hce.house_id))))));
CREATE POLICY "RBAC house_calendar_event_participants SELECT" ON public.ic_house_calendar_event_participants FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_calendar_events hce WHERE ((hce.id = public.ic_house_calendar_event_participants.event_id) AND (ic_jwt_has_house(hce.house_id) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])))))));

-- ic_house_calendar_event_staff
CREATE POLICY "RBAC house_calendar_event_staff ALL" ON public.ic_house_calendar_event_staff FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_calendar_events hce WHERE ((hce.id = public.ic_house_calendar_event_staff.event_id) AND ic_jwt_has_house(hce.house_id))))));
CREATE POLICY "RBAC house_calendar_event_staff SELECT" ON public.ic_house_calendar_event_staff FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_calendar_events hce WHERE ((hce.id = public.ic_house_calendar_event_staff.event_id) AND (ic_jwt_has_house(hce.house_id) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])))))));

-- ic_house_calendar_event_types_master
CREATE POLICY "RBAC house_calendar_event_types_master DELETE" ON public.ic_house_calendar_event_types_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC house_calendar_event_types_master SELECT" ON public.ic_house_calendar_event_types_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_calendar_events
CREATE POLICY "RBAC house_calendar_events ALL" ON public.ic_house_calendar_events FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_calendar_events SELECT" ON public.ic_house_calendar_events FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_has_house(house_id) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_checklist_item_attachments
CREATE POLICY "RBAC house_checklist_item_attachments ALL" ON public.ic_house_checklist_item_attachments FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE ((hcs.id = public.ic_house_checklist_item_attachments.submission_id) AND ic_jwt_has_house(hcs.house_id))))));
CREATE POLICY "RBAC house_checklist_item_attachments SELECT" ON public.ic_house_checklist_item_attachments FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE ((hcs.id = public.ic_house_checklist_item_attachments.submission_id) AND (ic_jwt_has_house(hcs.house_id) OR (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'read_only'])))))));

-- ic_house_checklist_items
CREATE POLICY "RBAC house_checklist_items ALL" ON public.ic_house_checklist_items FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_checklists hc WHERE ((hc.id = public.ic_house_checklist_items.checklist_id) AND ic_jwt_has_house(hc.house_id))))));
CREATE POLICY "RBAC house_checklist_items SELECT" ON public.ic_house_checklist_items FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'read_only'])) OR (EXISTS ( SELECT 1 FROM public.ic_house_checklists hc WHERE ((hc.id = public.ic_house_checklist_items.checklist_id) AND ic_jwt_has_house(hc.house_id)))));

-- ic_house_checklist_submission_items
CREATE POLICY "RBAC house_checklist_submission_items ALL" ON public.ic_house_checklist_submission_items FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE ((hcs.id = public.ic_house_checklist_submission_items.submission_id) AND ic_jwt_has_house(hcs.house_id))))));
CREATE POLICY "RBAC house_checklist_submission_items SELECT" ON public.ic_house_checklist_submission_items FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE ((hcs.id = public.ic_house_checklist_submission_items.submission_id) AND (ic_jwt_has_house(hcs.house_id) OR (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'read_only'])))))));

-- ic_house_checklist_submissions
CREATE POLICY "RBAC house_checklist_submissions DELETE" ON public.ic_house_checklist_submissions FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC house_checklist_submissions INSERT" ON public.ic_house_checklist_submissions FOR INSERT TO authenticated 
WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_checklist_submissions SELECT" ON public.ic_house_checklist_submissions FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('house_checklists') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_checklist_submissions UPDATE" ON public.ic_house_checklist_submissions FOR UPDATE TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)))
WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)));

-- ic_house_checklists
CREATE POLICY "RBAC house_checklists DELETE" ON public.ic_house_checklists FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC house_checklists INSERT" ON public.ic_house_checklists FOR INSERT TO authenticated 
WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_checklists SELECT" ON public.ic_house_checklists FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('house_checklists') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_checklists UPDATE" ON public.ic_house_checklists FOR UPDATE TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)))
WITH CHECK (ic_jwt_is_admin() OR (ic_jwt_get_perm('house_checklists') = 'full') OR ((ic_jwt_get_perm('house_checklists') = 'context_read_write') AND ic_jwt_has_house(house_id)));

-- ic_house_comms
CREATE POLICY "RBAC house_comms ALL" ON public.ic_house_comms FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_comms SELECT" ON public.ic_house_comms FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_has_house(house_id));

-- ic_house_files
CREATE POLICY "RBAC house_files ALL" ON public.ic_house_files FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_files SELECT" ON public.ic_house_files FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_has_house(house_id));

-- ic_house_form_assignments
CREATE POLICY "RBAC house_form_assignments ALL" ON public.ic_house_form_assignments FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_forms hf WHERE ((hf.id = public.ic_house_form_assignments.form_id) AND ic_jwt_has_house(hf.house_id))))));
CREATE POLICY "RBAC house_form_assignments SELECT" ON public.ic_house_form_assignments FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_forms hf WHERE ((hf.id = public.ic_house_form_assignments.form_id) AND ic_jwt_has_house(hf.house_id)))) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_form_submissions
CREATE POLICY "RBAC house_form_submissions ALL" ON public.ic_house_form_submissions FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_house_forms hf WHERE ((hf.id = public.ic_house_form_submissions.form_id) AND ic_jwt_has_house(hf.house_id))))));
CREATE POLICY "RBAC house_form_submissions SELECT" ON public.ic_house_form_submissions FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_forms hf WHERE ((hf.id = public.ic_house_form_submissions.form_id) AND ic_jwt_has_house(hf.house_id)))) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_forms
CREATE POLICY "RBAC house_forms ALL" ON public.ic_house_forms FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_forms SELECT" ON public.ic_house_forms FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_has_house(house_id) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_resources
CREATE POLICY "RBAC house_resources ALL" ON public.ic_house_resources FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full') OR ((ic_jwt_get_perm('houses') = 'context_read_write') AND ic_jwt_has_house(house_id)));
CREATE POLICY "RBAC house_resources SELECT" ON public.ic_house_resources FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_has_house(house_id));

-- ic_house_shift_templates
CREATE POLICY "RBAC house_shift_templates DELETE" ON public.ic_house_shift_templates FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC house_shift_templates SELECT" ON public.ic_house_shift_templates FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_house_staff_assignments
CREATE POLICY "RBAC house_staff_assignments ALL" ON public.ic_house_staff_assignments FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('employees') = 'full'));
CREATE POLICY "RBAC house_staff_assignments SELECT" ON public.ic_house_staff_assignments FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (staff_id = ic_jwt_get_staff_id()) OR (ic_jwt_get_perm('employees') = ANY (ARRAY['full', 'read_only'])) OR ic_jwt_has_house(house_id) OR ic_jwt_manages_staff(staff_id));

-- ic_house_types_master
CREATE POLICY "RBAC house_types_master DELETE" ON public.ic_house_types_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC house_types_master SELECT" ON public.ic_house_types_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_houses
CREATE POLICY "RBAC houses ALL" ON public.ic_houses FOR ALL TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = 'full'));
CREATE POLICY "RBAC houses SELECT" ON public.ic_houses FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('houses') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND ic_jwt_has_house(id)));

-- ic_leave_requests
CREATE POLICY "RBAC leave_requests ALL" ON public.ic_leave_requests FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR ((staff_id = ic_jwt_get_staff_id()) AND (status = 'pending')) OR (ic_jwt_get_perm('leave_requests') = 'full') OR ((ic_jwt_get_perm('leave_requests') = 'context_read_write') AND ic_jwt_manages_staff(staff_id)));
CREATE POLICY "RBAC leave_requests SELECT" ON public.ic_leave_requests FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (staff_id = ic_jwt_get_staff_id()) OR (ic_jwt_get_perm('leave_requests') = ANY (ARRAY['full', 'read_only'])) OR ic_jwt_manages_staff(staff_id));

-- ic_leave_types
CREATE POLICY "RBAC leave_types DELETE" ON public.ic_leave_types FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC leave_types SELECT" ON public.ic_leave_types FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_medications_master
CREATE POLICY "RBAC medications_master DELETE" ON public.ic_medications_master FOR DELETE TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC medications_master SELECT" ON public.ic_medications_master FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('master_lists') = ANY (ARRAY['full', 'read_only'])));

-- ic_notifications
CREATE POLICY "RBAC notifications ALL" ON public.ic_notifications FOR ALL TO authenticated USING ((user_id = auth.uid()) OR ic_jwt_is_admin());

-- ic_participant_contacts
CREATE POLICY "RBAC participant_contacts ALL" ON public.ic_participant_contacts FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = 'full') OR ((ic_jwt_get_perm('participants') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_contacts.participant_id) AND ic_jwt_has_house(p.house_id))))));
CREATE POLICY "RBAC participant_contacts SELECT" ON public.ic_participant_contacts FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_contacts.participant_id) AND ic_jwt_has_house(p.house_id)))));

-- ic_participant_documents
CREATE POLICY "RBAC participant_documents ALL" ON public.ic_participant_documents FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = 'full') OR ((ic_jwt_get_perm('participants') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_documents.participant_id) AND ic_jwt_has_house(p.house_id))))));
CREATE POLICY "RBAC participant_documents SELECT" ON public.ic_participant_documents FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_documents.participant_id) AND ic_jwt_has_house(p.house_id)))));

-- ic_participant_forms
CREATE POLICY "RBAC participant_forms ALL" ON public.ic_participant_forms FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = 'full') OR ((ic_jwt_get_perm('participants') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_forms.participant_id) AND ic_jwt_has_house(p.house_id))))));
CREATE POLICY "RBAC participant_forms SELECT" ON public.ic_participant_forms FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_forms.participant_id) AND ic_jwt_has_house(p.house_id)))));

-- ic_participant_funding
CREATE POLICY "RBAC participant_funding ALL" ON public.ic_participant_funding FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = 'full') OR ((ic_jwt_get_perm('participants') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_funding.participant_id) AND ic_jwt_has_house(p.house_id))))));
CREATE POLICY "RBAC participant_funding SELECT" ON public.ic_participant_funding FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.ic_participant_funding.participant_id) AND ic_jwt_has_house(p.house_id)))));

-- ic_participant_goal_progress
CREATE POLICY "RBAC participant_goal_progress ALL" ON public.ic_participant_goal_progress FOR ALL TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = 'full') OR ((ic_jwt_get_perm('participants') = 'context_read_write') AND (EXISTS ( SELECT 1 FROM public.ic_participant_goals pg JOIN public.ic_participants p ON (p.id = pg.participant_id) WHERE ((pg.id = public.ic_participant_goal_progress.goal_id) AND ic_jwt_has_house(p.house_id))))));

-- ic_participants
CREATE POLICY "RBAC participants ALL (Admin)" ON public.ic_participants FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC participants SELECT" ON public.ic_participants FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('participants') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND ic_jwt_has_house(house_id)));

-- ic_staff
CREATE POLICY "RBAC staff ALL (Admin)" ON public.ic_staff FOR ALL TO authenticated USING (ic_jwt_is_admin());
CREATE POLICY "RBAC staff SELECT" ON public.ic_staff FOR SELECT TO authenticated 
USING (ic_jwt_is_admin() OR (id = ic_jwt_get_staff_id()) OR (ic_jwt_get_perm('employees') = ANY (ARRAY['full', 'read_only'])) OR ic_jwt_manages_staff(id) OR EXISTS (SELECT 1 FROM public.ic_house_staff_assignments hsa WHERE hsa.staff_id = public.ic_staff.id AND ic_jwt_has_house(hsa.house_id)));


-- ==========================================
-- 4. APPLY "MASTER TABLE" PATTERN TO MISSING TABLES
-- ==========================================
DO $$
DECLARE
    t text;
    master_tables text[] := ARRAY[
        'permission_mappings', 'positions', 'provider_participants', 'providers', 
        'service_participants', 'service_staff', 'services', 
        'shift_template_checklists', 'shift_template_default_checklists'
    ];
BEGIN
    FOREACH t IN ARRAY master_tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %s SELECT" ON public.%I FOR SELECT TO authenticated USING (ic_jwt_is_admin() OR ic_jwt_get_perm(''master_lists'') IN (''full'', ''read_only''))', t, 'ic_' || t);
        EXECUTE format('CREATE POLICY "RBAC %s DELETE" ON public.%I FOR DELETE TO authenticated USING (ic_jwt_is_admin())', t, 'ic_' || t);
        EXECUTE format('CREATE POLICY "RBAC %s ALL (Admin)" ON public.%I FOR ALL TO authenticated USING (ic_jwt_is_admin())', t, 'ic_' || t);
    END LOOP;
END $$;


-- ==========================================
-- 5. APPLY "PARTICIPANT PATTERN" TO MISSING CLINICAL TABLES
-- ==========================================
DO $$
DECLARE
    t text;
    clinical_tables text[] := ARRAY[
        'participant_goals', 'participant_hygiene_routines', 'participant_medications', 
        'participant_notes', 'participant_restrictive_practices'
    ];
BEGIN
    FOREACH t IN ARRAY clinical_tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %s ALL" ON public.%I FOR ALL TO authenticated 
            USING (ic_jwt_is_admin() OR (ic_jwt_get_perm(''participants'') = ''full'') OR ((ic_jwt_get_perm(''participants'') = ''context_read_write'') AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.%I.participant_id) AND ic_jwt_has_house(p.house_id))))))', t, 'ic_' || t, 'ic_' || t);
        
        EXECUTE format('CREATE POLICY "RBAC %s SELECT" ON public.%I FOR SELECT TO authenticated 
            USING (ic_jwt_is_admin() OR (ic_jwt_get_perm(''participants'') = ANY (ARRAY[''full'', ''read_only''])) OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((p.id = public.%I.participant_id) AND ic_jwt_has_house(p.house_id)))))', t, 'ic_' || t, 'ic_' || t);
    END LOOP;
END $$;


-- ==========================================
-- 6. ADMIN-ONLY TABLES (SECURITY & CONFIG)
-- ==========================================
DO $$
DECLARE
    t text;
    admin_tables text[] := ARRAY['role_permissions', 'roles', 'user_roles'];
BEGIN
    FOREACH t IN ARRAY admin_tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %s ALL (Admin)" ON public.%I FOR ALL TO authenticated USING (ic_jwt_is_admin())', t, 'ic_' || t);
    END LOOP;
END $$;


-- ==========================================
-- 7. REMAINING TABLES (DEFAULT TO ADMIN-ONLY)
-- ==========================================
DO $$
DECLARE
    tab_name text;
BEGIN
    FOR tab_name IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'ic_%'
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename
        )
    )
    LOOP
        EXECUTE format('CREATE POLICY "RBAC %s ALL (Admin)" ON public.%I FOR ALL TO authenticated USING (ic_jwt_is_admin())', tab_name, tab_name);
    END LOOP;
END $$;


-- ==========================================
-- 8. RECREATE STORAGE POLICIES
-- ==========================================

-- Global Admin Policy
CREATE POLICY "RBAC storage_objects ALL (Admin)" ON storage.objects FOR ALL TO authenticated USING (ic_jwt_is_admin());

-- ic_branch-documents
CREATE POLICY "RBAC branch_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_branch-documents') AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_houses h WHERE (((h.branch_id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(h.id))))));

-- ic_checklist-attachments
CREATE POLICY "RBAC checklist_attachments INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_checklist-attachments') AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE (((hcs.id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(hcs.house_id) AND (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'context_read_write'])))))));

CREATE POLICY "RBAC checklist_attachments SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_checklist-attachments') AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_house_checklist_submissions hcs WHERE (((hcs.id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(hcs.house_id))))));

-- ic_house-documents
CREATE POLICY "RBAC house_documents INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_house-documents') AND (ic_jwt_is_admin() OR (ic_jwt_has_house((split_part(name, '/', 1))::uuid) AND (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'context_read_write'])))));

CREATE POLICY "RBAC house_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_house-documents') AND (ic_jwt_is_admin() OR ic_jwt_has_house((split_part(name, '/', 1))::uuid) OR (ic_jwt_get_perm('houses') = ANY (ARRAY['full', 'read_only']))));

-- ic_participant-documents
CREATE POLICY "RBAC participant_documents INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_participant-documents') AND (ic_jwt_is_admin() OR (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE (((p.id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(p.house_id) AND (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'context_read_write'])))))));

CREATE POLICY "RBAC participant_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_participant-documents') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('participants') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE (((p.id)::text = split_part(name, '/', 1)) AND ic_jwt_has_house(p.house_id)))))));

-- ic_participant-photos
CREATE POLICY "RBAC participant_photos INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_participant-photos') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'context_read_write']))));

CREATE POLICY "RBAC participant_photos SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_participant-photos') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'read_only'])) OR ((ic_jwt_get_perm('participants') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM public.ic_participants p WHERE ((((p.id)::text = split_part(name, '/', 1)) OR (p.photo_url ~~* ('%' || name))) AND ic_jwt_has_house(p.house_id)))))));

-- ic_staff-documents
CREATE POLICY "RBAC staff_documents INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_staff-documents') AND (ic_jwt_is_admin() OR (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text) OR (ic_jwt_get_perm('employees') = 'full')));

CREATE POLICY "RBAC staff_documents SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_staff-documents') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('employees') = ANY (ARRAY['full', 'read_only'])) OR (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text) OR ((ic_jwt_get_perm('employees') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM public.ic_staff s WHERE (((s.id)::text = split_part(name, '/', 1)) AND ic_jwt_manages_staff(s.id)))))));

-- ic_staff-photos
CREATE POLICY "RBAC staff_photos INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ((bucket_id = 'ic_staff-photos') AND (ic_jwt_is_admin() OR (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text) OR (ic_jwt_get_perm('employees') = 'full')));

CREATE POLICY "RBAC staff_photos SELECT" ON storage.objects FOR SELECT TO authenticated 
USING ((bucket_id = 'ic_staff-photos') AND (ic_jwt_is_admin() OR (ic_jwt_get_perm('employees') = ANY (ARRAY['full', 'read_only'])) OR (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text) OR ((ic_jwt_get_perm('employees') = ANY (ARRAY['context_read_write', 'context_read_only'])) AND (EXISTS ( SELECT 1 FROM (public.ic_house_staff_assignments hsa JOIN public.ic_staff s ON ((s.id = hsa.staff_id))) WHERE ((((hsa.staff_id)::text = split_part(name, '/', 1)) OR (s.photo_url ~~* ('%' || name))) AND ic_jwt_has_house(hsa.house_id)))))));

-- Combined Storage Insert Policy
CREATE POLICY "RBAC storage_objects INSERT" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (ic_jwt_is_admin() 
  OR ((bucket_id = 'ic_checklist-attachments') AND (ic_jwt_get_perm('house_checklists') = ANY (ARRAY['full', 'context_read_write']))) 
  OR ((bucket_id = 'ic_participant-photos') AND (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'context_read_write']))) 
  OR ((bucket_id = 'ic_participant-documents') AND (ic_jwt_get_perm('participants') = ANY (ARRAY['full', 'context_read_write']))) 
  OR ((bucket_id = 'ic_staff-photos') AND (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text)) 
  OR ((bucket_id = 'ic_staff-documents') AND (split_part(name, '/', 1) = (ic_jwt_get_staff_id())::text))
);

COMMIT;

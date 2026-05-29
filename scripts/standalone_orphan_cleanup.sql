-- ======================================================================================
-- Standalone Data Cleanup Script
-- Purpose: Nullify any orphaned 'created_by' or 'updated_by' IDs that do not exist in ic_staff.
-- ======================================================================================

DO $$
DECLARE
    t text;
    constraint_record RECORD;
    tables text[] := ARRAY[
        'ic_behaviour_types_master', 'ic_branch_policies', 'ic_branches', 'ic_checklist_item_master',
        'ic_checklist_master', 'ic_checklist_schedules', 'ic_contact_types_master', 'ic_departments',
        'ic_employment_types_master', 'ic_funding_sources_master', 'ic_funding_types_master',
        'ic_house_calendar_event_attachments', 'ic_house_calendar_event_participants',
        'ic_house_calendar_event_staff', 'ic_house_calendar_event_types_master', 'ic_house_calendar_events',
        'ic_house_checklist_item_attachments', 'ic_house_checklist_items', 'ic_house_checklist_submission_items',
        'ic_house_checklist_submissions', 'ic_house_checklists', 'ic_house_comms', 'ic_house_files',
        'ic_house_form_assignments', 'ic_house_form_submissions', 'ic_house_forms', 'ic_house_resources',
        'ic_house_shift_templates', 'ic_house_staff_assignments', 'ic_house_types_master', 'ic_houses',
        'ic_incident_reports', 'ic_leave_requests', 'ic_leave_types', 'ic_medications_master',
        'ic_notifications', 'ic_participant_contacts', 'ic_participant_document_roles',
        'ic_participant_documents', 'ic_participant_forms', 'ic_participant_funding',
        'ic_participant_goal_progress', 'ic_participant_goals', 'ic_participant_hygiene_routines',
        'ic_participant_medications', 'ic_participant_notes', 'ic_participant_restrictive_practices',
        'ic_participants', 'ic_permission_mappings', 'ic_positions', 'ic_provider_participants',
        'ic_providers', 'ic_role_permissions', 'ic_roles', 'ic_seizure_types_master',
        'ic_service_participants', 'ic_service_staff', 'ic_services', 'ic_shift_assigned_checklists',
        'ic_shift_notes', 'ic_shift_participants', 'ic_shift_template_checklists',
        'ic_shift_template_default_checklists', 'ic_staff', 'ic_staff_compliance',
        'ic_staff_document_roles', 'ic_staff_documents', 'ic_staff_shifts', 'ic_staff_training',
        'ic_timesheets', 'ic_user_roles'
    ];
BEGIN
    RAISE NOTICE 'Starting standalone orphan cleanup...';
    
    FOREACH t IN ARRAY tables LOOP
        RAISE NOTICE 'Processing table: %', t;
        
        -- Drop existing FK constraints on created_by/updated_by to avoid violations during update
        FOR constraint_record IN 
            SELECT conname as constraint_name FROM pg_constraint con
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
            WHERE con.contype = 'f' 
            AND con.conrelid = format('public.%I', t)::regclass 
            AND att.attname IN ('created_by', 'updated_by')
        LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, constraint_record.constraint_name);
        END LOOP;
        
        -- Disable triggers temporarily to prevent audit trigger interference
        EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', t);
        
        -- Check and update created_by if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'created_by') THEN
            EXECUTE format('UPDATE public.%I t SET created_by = s.id FROM public.ic_staff s WHERE t.created_by = s.auth_user_id AND NOT EXISTS (SELECT 1 FROM public.ic_staff s2 WHERE s2.id = t.created_by)', t);
            EXECUTE format('UPDATE public.%I SET created_by = NULL WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = created_by)', t);
        END IF;

        -- Check and update updated_by if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'updated_by') THEN
            EXECUTE format('UPDATE public.%I t SET updated_by = s.id FROM public.ic_staff s WHERE t.updated_by = s.auth_user_id AND NOT EXISTS (SELECT 1 FROM public.ic_staff s2 WHERE s2.id = t.updated_by)', t);
            EXECUTE format('UPDATE public.%I SET updated_by = NULL WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = updated_by)', t);
        END IF;
        
        -- Re-enable triggers
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);
    END LOOP;
    
    RAISE NOTICE 'Cleanup complete.';
END $$;

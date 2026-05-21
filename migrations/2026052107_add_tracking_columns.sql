-- Migration: Add tracking columns (created_by, updated_by) to all relevant tables
-- Description: Adds created_by and updated_by columns referencing auth.users(id) to support auditing.

DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
        'ic_branches',
        'ic_checklist_item_master',
        'ic_checklist_master',
        'ic_checklist_schedules',
        'ic_contact_types_master',
        'ic_departments',
        'ic_employment_types_master',
        'ic_funding_sources_master',
        'ic_funding_types_master',
        'ic_house_calendar_event_attachments',
        'ic_house_calendar_event_participants',
        'ic_house_calendar_event_staff',
        'ic_house_calendar_event_types_master',
        'ic_house_calendar_events',
        'ic_house_checklist_item_attachments',
        'ic_house_checklist_items',
        'ic_house_checklist_submission_items',
        'ic_house_checklist_submissions',
        'ic_house_checklists',
        'ic_house_comms',
        'ic_house_files',
        'ic_house_form_assignments',
        'ic_house_form_submissions',
        'ic_house_forms',
        'ic_house_resources',
        'ic_house_shift_templates',
        'ic_house_staff_assignments',
        'ic_house_types_master',
        'ic_houses',
        'ic_leave_requests',
        'ic_leave_types',
        'ic_medications_master',
        'ic_notifications',
        'ic_participant_contacts',
        'ic_participant_documents',
        'ic_participant_forms',
        'ic_participant_funding',
        'ic_participant_goal_progress',
        'ic_participant_goals',
        'ic_participant_hygiene_routines',
        'ic_participant_medications',
        'ic_participant_notes',
        'ic_participant_restrictive_practices',
        'ic_participants',
        'ic_permission_mappings',
        'ic_positions',
        'ic_provider_participants',
        'ic_providers',
        'ic_role_permissions',
        'ic_roles',
        'ic_service_participants',
        'ic_service_staff',
        'ic_services',
        'ic_shift_assigned_checklists',
        'ic_shift_notes',
        'ic_shift_participants',
        'ic_shift_template_checklists',
        'ic_shift_template_default_checklists',
        'ic_staff',
        'ic_staff_compliance',
        'ic_staff_documents',
        'ic_staff_shifts',
        'ic_staff_training',
        'ic_timesheets',
        'ic_user_roles'
    ];
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        -- Add created_by if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'created_by') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN created_by UUID REFERENCES auth.users(id)', t);
        END IF;
        
        -- Add updated_by if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_by') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN updated_by UUID REFERENCES auth.users(id)', t);
        END IF;
    END LOOP;
END $$;

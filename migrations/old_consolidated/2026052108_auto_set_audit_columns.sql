-- Migration: Automate audit columns (created_by, updated_by)
-- Description: Creates a trigger function to automatically set created_by and updated_by using auth.uid().

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.ic_set_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- On insert, set both if they are not already provided (or override them)
    -- We use COALESCE to allow manual setting if needed, or just force it for security
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
  ELSIF (TG_OP = 'UPDATE') THEN
    -- On update, always update the updated_by column
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply the trigger to all relevant tables
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
        -- Drop existing trigger if it exists to avoid errors on re-run
        EXECUTE format('DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.%I', t);
        
        -- Create the trigger
        EXECUTE format('
            CREATE TRIGGER ic_trigger_set_audit_columns
            BEFORE INSERT OR UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.ic_set_audit_columns();
        ', t);
    END LOOP;
END $$;

-- ============================================================================
-- Migration Script: 2026072801_production_go_live_purge.sql
-- Purpose: Purge development dummy data to prepare InsideCare for Production Go-Live.
-- Preserves: Master reference tables, security role matrices, NDIS lookup scales,
--            and the primary Sys Admin account (julian.gibbings@gmail.com).
-- WARNING: DESTRUCTIVE ACTION - EXECUTE ON DEV/STAGING BEFORE PROD GO-LIVE.
-- ============================================================================

BEGIN;

-- Disable triggers temporarily for high-speed foreign key cleanup
SET session_replication_role = 'replica';

-- 1. PURGE DUMMY OPERATIONAL DATA
TRUNCATE TABLE public.ic_shift_note_sleep_records CASCADE;
TRUNCATE TABLE public.ic_shift_notes CASCADE;
TRUNCATE TABLE public.ic_shift_participants CASCADE;
TRUNCATE TABLE public.ic_shift_assigned_checklists CASCADE;
TRUNCATE TABLE public.ic_staff_shifts CASCADE;
TRUNCATE TABLE public.ic_timesheets CASCADE;
TRUNCATE TABLE public.ic_incident_reports CASCADE;
TRUNCATE TABLE public.ic_leave_requests CASCADE;

-- 2. PURGE DUMMY HOUSE & CHECKLIST DATA
TRUNCATE TABLE public.ic_house_checklist_submission_items CASCADE;
TRUNCATE TABLE public.ic_house_checklist_submissions CASCADE;
TRUNCATE TABLE public.ic_house_checklist_item_attachments CASCADE;
TRUNCATE TABLE public.ic_house_checklist_items CASCADE;
TRUNCATE TABLE public.ic_house_checklists CASCADE;
TRUNCATE TABLE public.ic_house_calendar_event_attachments CASCADE;
TRUNCATE TABLE public.ic_house_calendar_event_participants CASCADE;
TRUNCATE TABLE public.ic_house_calendar_event_staff CASCADE;
TRUNCATE TABLE public.ic_house_calendar_events CASCADE;
TRUNCATE TABLE public.ic_house_form_submissions CASCADE;
TRUNCATE TABLE public.ic_house_form_assignments CASCADE;
TRUNCATE TABLE public.ic_house_forms CASCADE;
TRUNCATE TABLE public.ic_house_comms CASCADE;
TRUNCATE TABLE public.ic_house_files CASCADE;
TRUNCATE TABLE public.ic_house_resources CASCADE;
TRUNCATE TABLE public.ic_house_shift_templates CASCADE;
TRUNCATE TABLE public.ic_shift_template_checklists CASCADE;
TRUNCATE TABLE public.ic_shift_template_default_checklists CASCADE;
TRUNCATE TABLE public.ic_house_staff_assignments CASCADE;
TRUNCATE TABLE public.ic_houses CASCADE;

-- 3. PURGE DUMMY PARTICIPANT DATA
TRUNCATE TABLE public.ic_participant_medications CASCADE;
TRUNCATE TABLE public.ic_participant_notes CASCADE;
TRUNCATE TABLE public.ic_participant_goals CASCADE;
TRUNCATE TABLE public.ic_participant_goal_progress CASCADE;
TRUNCATE TABLE public.ic_participant_documents CASCADE;
TRUNCATE TABLE public.ic_participant_document_roles CASCADE;
TRUNCATE TABLE public.ic_participant_contacts CASCADE;
TRUNCATE TABLE public.ic_participant_restrictive_practices CASCADE;
TRUNCATE TABLE public.ic_participant_hygiene_routines CASCADE;
TRUNCATE TABLE public.ic_participant_forms CASCADE;
TRUNCATE TABLE public.ic_provider_participants CASCADE;
TRUNCATE TABLE public.ic_service_participants CASCADE;
TRUNCATE TABLE public.ic_participants CASCADE;

-- 4. PURGE DUMMY STAFF DATA (PRESERVING SYS ADMIN: julian.gibbings@gmail.com)
DELETE FROM public.ic_staff_compliance_documents WHERE staff_compliance_id IN (
  SELECT id FROM public.ic_staff_compliance WHERE staff_id NOT IN (
    SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
  )
);
DELETE FROM public.ic_staff_compliance WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);
DELETE FROM public.ic_staff_training WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);
DELETE FROM public.ic_staff_qualifications WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);
DELETE FROM public.ic_staff_documents WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);
DELETE FROM public.ic_staff_availability WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);
DELETE FROM public.ic_staff_onboarding WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);
DELETE FROM public.ic_staff_organisations WHERE staff_id NOT IN (
  SELECT id FROM public.ic_staff WHERE LOWER(email) = 'julian.gibbings@gmail.com' OR auth_user_id = auth.uid()
);

-- Delete dummy staff members (excluding Sys Admin: julian.gibbings@gmail.com)
DELETE FROM public.ic_staff 
WHERE LOWER(email) != 'julian.gibbings@gmail.com' 
  AND (auth_user_id IS NULL OR auth_user_id != auth.uid());

-- 5. PURGE AUDIT & NOTIFICATION LOGS
TRUNCATE TABLE public.ic_activity_log CASCADE;
TRUNCATE TABLE public.ic_notifications CASCADE;
TRUNCATE TABLE public.ic_error_logs CASCADE;

-- Re-enable normal trigger execution
SET session_replication_role = 'origin';

COMMIT;

-- InsideCare Baseline Migration
-- Generated from docs/database_schema/dev/schema_metadata.json
-- Date: 2026-07-27
BEGIN;

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Enums
DROP TYPE IF EXISTS public.ic_access_level_enum CASCADE;
CREATE TYPE public.ic_access_level_enum AS ENUM ('full', 'context_read_write', 'context_read_only', 'read_only', 'none');
DROP TYPE IF EXISTS public.ic_compliance_status_enum CASCADE;
CREATE TYPE public.ic_compliance_status_enum AS ENUM ('complete', 'in_progress', 'not_applicable');
DROP TYPE IF EXISTS public.ic_shift_period_enum CASCADE;
CREATE TYPE public.ic_shift_period_enum AS ENUM ('morning', 'day', 'night', 'all', 'afternoon', 'evening', 'sleepover');
DROP TYPE IF EXISTS public.ic_status_enum CASCADE;
CREATE TYPE public.ic_status_enum AS ENUM ('draft', 'active', 'inactive', 'archived');

-- 2. Tables
DROP TABLE IF EXISTS public.ic_activity_log CASCADE;
CREATE TABLE public.ic_activity_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    activity_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    entity_name text,
    description text,
    user_name text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    table_name text,
    parent_name text,
    parent_type text,
    parent_id uuid,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_behaviour_intensity_master CASCADE;
CREATE TABLE public.ic_behaviour_intensity_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_bowel_amounts_master CASCADE;
CREATE TABLE public.ic_bowel_amounts_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_bowel_assistance_master CASCADE;
CREATE TABLE public.ic_bowel_assistance_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_branch_policies CASCADE;
CREATE TABLE public.ic_branch_policies (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    branch_id uuid NOT NULL,
    policy_type text NOT NULL,
    title text NOT NULL,
    description text,
    document_url text,
    version text,
    effective_date date,
    review_date date,
    status text DEFAULT 'active'::character varying,
    created_by uuid,
    approved_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_branches CASCADE;
CREATE TABLE public.ic_branches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    branch_name text NOT NULL,
    company_name text,
    address text,
    phone text,
    email text,
    manager_name text,
    operating_hours text,
    service_areas text,
    number_of_staff integer DEFAULT 0,
    number_of_houses integer DEFAULT 0,
    compliance_status text DEFAULT 'pending'::text,
    last_audit_date text,
    next_review_date text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_checklist_item_master CASCADE;
CREATE TABLE public.ic_checklist_item_master (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    master_id uuid NOT NULL,
    title text NOT NULL,
    instructions text,
    priority text DEFAULT 'medium'::text,
    is_required boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    group_title text NOT NULL,
    group_id uuid,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_checklist_master CASCADE;
CREATE TABLE public.ic_checklist_master (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    checklist_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    days_of_week text[],
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_checklist_schedules CASCADE;
CREATE TABLE public.ic_checklist_schedules (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid NOT NULL,
    house_checklist_id uuid NOT NULL,
    rrule text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    target_shift ic_shift_period_enum NOT NULL DEFAULT 'all'::ic_shift_period_enum,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_compliance_types_master CASCADE;
CREATE TABLE public.ic_compliance_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    compliance_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    attachment_applicable boolean NOT NULL DEFAULT false,
    expiry_date_applicable boolean DEFAULT true,
    document_number_applicable boolean DEFAULT false,
    comments_applicable boolean DEFAULT false,
    system_category text,
    organisation_id uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_contact_types_master CASCADE;
CREATE TABLE public.ic_contact_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    contact_type_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_departments CASCADE;
CREATE TABLE public.ic_departments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    department_name text NOT NULL,
    description text,
    access_level text DEFAULT 'Limited'::text,
    status text DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_employment_types_master CASCADE;
CREATE TABLE public.ic_employment_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    employment_type_name text NOT NULL,
    description text,
    status text DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_error_logs CASCADE;
CREATE TABLE public.ic_error_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    message text NOT NULL,
    category text NOT NULL,
    details jsonb,
    url text,
    user_agent text,
    app_version text,
    resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_calendar_event_attachments CASCADE;
CREATE TABLE public.ic_house_calendar_event_attachments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_calendar_event_participants CASCADE;
CREATE TABLE public.ic_house_calendar_event_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_calendar_event_staff CASCADE;
CREATE TABLE public.ic_house_calendar_event_staff (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_calendar_event_types_master CASCADE;
CREATE TABLE public.ic_house_calendar_event_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_type_name text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    color text NOT NULL DEFAULT 'blue'::text,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_calendar_events CASCADE;
CREATE TABLE public.ic_house_calendar_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    status text DEFAULT 'scheduled'::text,
    location text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    event_type_id uuid,
    checklist_schedule_id uuid,
    house_checklist_id uuid,
    is_checklist_event boolean DEFAULT false,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_checklist_item_attachments CASCADE;
CREATE TABLE public.ic_house_checklist_item_attachments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    submission_id uuid NOT NULL,
    item_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    mime_type text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_checklist_items CASCADE;
CREATE TABLE public.ic_house_checklist_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    checklist_id uuid,
    title text NOT NULL,
    instructions text,
    priority text DEFAULT 'medium'::text,
    is_required boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    master_item_id uuid,
    group_title text,
    group_id uuid,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_checklist_submission_items CASCADE;
CREATE TABLE public.ic_house_checklist_submission_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    submission_id uuid NOT NULL,
    item_id uuid NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    note text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    master_item_id uuid,
    completed_by uuid,
    status text DEFAULT 'Pending'::text,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_checklist_submissions CASCADE;
CREATE TABLE public.ic_house_checklist_submissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    checklist_id uuid NOT NULL,
    house_id uuid NOT NULL,
    submitted_by uuid,
    status text NOT NULL DEFAULT 'in_progress'::text,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    master_id uuid,
    scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
    shift_id uuid,
    calendar_event_id uuid,
    shift_assignment_id uuid,
    shift_template_id uuid,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_checklists CASCADE;
CREATE TABLE public.ic_house_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid,
    house_checklist_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    master_id uuid,
    days_of_week text[],
    sort_order integer NOT NULL DEFAULT 0,
    is_global boolean DEFAULT false,
    created_by uuid,
    updated_by uuid,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_comms CASCADE;
CREATE TABLE public.ic_house_comms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    house_id uuid NOT NULL,
    entry_date date NOT NULL DEFAULT CURRENT_DATE,
    content text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_files CASCADE;
CREATE TABLE public.ic_house_files (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    file_type text,
    category text,
    version text,
    status text DEFAULT 'current'::text,
    uploaded_by text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_form_assignments CASCADE;
CREATE TABLE public.ic_house_form_assignments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    form_id uuid,
    participant_id uuid,
    staff_id uuid,
    assigned_by uuid,
    due_date date,
    status text DEFAULT 'pending'::text,
    completed_at timestamp with time zone,
    completed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_form_submissions CASCADE;
CREATE TABLE public.ic_house_form_submissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    form_id uuid,
    assignment_id uuid,
    submitted_by uuid,
    participant_id uuid,
    submission_data jsonb,
    status text DEFAULT 'complete'::text,
    submitted_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_forms CASCADE;
CREATE TABLE public.ic_house_forms (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid,
    house_form_name text NOT NULL,
    type text NOT NULL,
    description text,
    frequency text NOT NULL,
    is_global boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_resources CASCADE;
CREATE TABLE public.ic_house_resources (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid,
    title text NOT NULL,
    category text NOT NULL,
    type text NOT NULL,
    description text,
    file_url text,
    file_name text,
    file_size integer,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    is_active boolean DEFAULT true,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_shift_templates CASCADE;
CREATE TABLE public.ic_house_shift_templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid NOT NULL,
    shift_template_name text NOT NULL,
    short_name text,
    icon_name text,
    color_theme text,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    default_start_time time without time zone,
    default_end_time time without time zone,
    created_by uuid,
    updated_by uuid,
    organisation_id uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_staff_assignments CASCADE;
CREATE TABLE public.ic_house_staff_assignments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    is_primary boolean DEFAULT false,
    start_date date,
    end_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_house_types_master CASCADE;
CREATE TABLE public.ic_house_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    house_type_name text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_houses CASCADE;
CREATE TABLE public.ic_houses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    house_name text NOT NULL,
    branch_id uuid,
    address text,
    phone text,
    capacity integer DEFAULT 0,
    current_occupancy integer DEFAULT 0,
    house_manager text,
    status text DEFAULT 'active'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    house_type_id uuid,
    individuals_breakdown text,
    participant_dynamics text,
    observations text,
    general_house_details text,
    setup_step integer NOT NULL DEFAULT 1,
    is_configured boolean NOT NULL DEFAULT false,
    created_by uuid,
    updated_by uuid,
    risk_management text,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_hygiene_levels_master CASCADE;
CREATE TABLE public.ic_hygiene_levels_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_id_document_types CASCADE;
CREATE TABLE public.ic_id_document_types (
    name text NOT NULL,
    category text NOT NULL,
    points integer NOT NULL,
    expiry_date_applicable boolean DEFAULT false,
    placeholder text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    attachment_applicable boolean NOT NULL DEFAULT true,
    document_number_applicable boolean NOT NULL DEFAULT true,
    comments_applicable boolean NOT NULL DEFAULT true,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_incident_reports CASCADE;
CREATE TABLE public.ic_incident_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    incident_date timestamp with time zone NOT NULL,
    incident_type text,
    involved_participant_id uuid NOT NULL,
    involved_staff_id uuid,
    description text,
    status text DEFAULT 'Under Review'::text,
    priority text NOT NULL DEFAULT 'Medium'::text,
    reported_by uuid NOT NULL,
    house_id uuid,
    follow_up_required boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    incident_type_id uuid,
    severity text,
    summary text,
    details text,
    outcome text,
    witnesses text,
    notified_parties text,
    is_restrictive_practice boolean NOT NULL DEFAULT false,
    restrictive_practice_type_id uuid,
    restrictive_practice_description text,
    rp_start_time timestamp with time zone,
    rp_end_time timestamp with time zone,
    rp_reason text,
    rp_triggers text,
    rp_observed_behaviours text,
    rp_outcome text,
    is_ndis_reportable boolean NOT NULL DEFAULT false,
    admin_status text DEFAULT 'New'::text,
    admin_actions_taken text,
    ndis_reported_date date,
    reference_id text,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_incident_types_master CASCADE;
CREATE TABLE public.ic_incident_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    organisation_id uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_leave_requests CASCADE;
CREATE TABLE public.ic_leave_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text NOT NULL DEFAULT 'pending'::text,
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    attachment_url text,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_leave_types CASCADE;
CREATE TABLE public.ic_leave_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    leave_type_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_medication_types_master CASCADE;
CREATE TABLE public.ic_medication_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    medication_type_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    is_active boolean DEFAULT true,
    organisation_id uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_medications_master CASCADE;
CREATE TABLE public.ic_medications_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    medication_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    side_effects text,
    interactions text,
    type_id uuid NOT NULL,
    brand_name text,
    sub_class text,
    purpose text,
    contraindications text,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_mtm_diet_types_master CASCADE;
CREATE TABLE public.ic_mtm_diet_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_mtm_fluid_intake_master CASCADE;
CREATE TABLE public.ic_mtm_fluid_intake_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_mtm_fluids_master CASCADE;
CREATE TABLE public.ic_mtm_fluids_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_mtm_meal_intake_master CASCADE;
CREATE TABLE public.ic_mtm_meal_intake_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_mtm_swallowing_concerns_master CASCADE;
CREATE TABLE public.ic_mtm_swallowing_concerns_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_notifications CASCADE;
CREATE TABLE public.ic_notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    link text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    metadata jsonb,
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_nutrition_intake_master CASCADE;
CREATE TABLE public.ic_nutrition_intake_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_nutrition_meal_types_master CASCADE;
CREATE TABLE public.ic_nutrition_meal_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_onboarding_items_master CASCADE;
CREATE TABLE public.ic_onboarding_items_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    item_name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_organisations CASCADE;
CREATE TABLE public.ic_organisations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    contact_email text,
    phone text,
    address text,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    UNIQUE (slug)
);
DROP TABLE IF EXISTS public.ic_participant_contacts CASCADE;
CREATE TABLE public.ic_participant_contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    contact_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text,
    email text,
    address text,
    notes text,
    contact_type_id uuid,
    created_by uuid,
    updated_by uuid,
    is_emergency_contact boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_document_roles CASCADE;
CREATE TABLE public.ic_participant_document_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    role_id uuid NOT NULL,
    access_level ic_access_level_enum NOT NULL DEFAULT 'read_only'::ic_access_level_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_documents CASCADE;
CREATE TABLE public.ic_participant_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_forms CASCADE;
CREATE TABLE public.ic_participant_forms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    form_type text NOT NULL,
    form_title text NOT NULL,
    form_data jsonb,
    submitted_by uuid,
    submission_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_goal_progress CASCADE;
CREATE TABLE public.ic_participant_goal_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    goal_id uuid NOT NULL,
    progress_note text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_goals CASCADE;
CREATE TABLE public.ic_participant_goals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    goal_type text NOT NULL,
    description text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_hygiene_routines CASCADE;
CREATE TABLE public.ic_participant_hygiene_routines (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    routine_type text NOT NULL,
    support_level text NOT NULL,
    frequency text,
    time_of_day text,
    duration_minutes integer,
    specific_instructions text,
    equipment_needed text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_medications CASCADE;
CREATE TABLE public.ic_participant_medications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    dosage text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    medication_id uuid,
    created_by uuid,
    updated_by uuid,
    is_prn boolean NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_notes CASCADE;
CREATE TABLE public.ic_participant_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    note_type text,
    content text NOT NULL,
    is_important boolean DEFAULT false,
    is_private boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participant_restrictive_practices CASCADE;
CREATE TABLE public.ic_participant_restrictive_practices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    practice_type text NOT NULL,
    description text NOT NULL,
    justification text NOT NULL,
    authorization_date date,
    authorized_by text,
    review_date date NOT NULL,
    status text DEFAULT 'Active'::text,
    conditions text,
    alternatives_considered text,
    monitoring_requirements text,
    incident_reporting_protocol text,
    is_ndis_reportable boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_participants CASCADE;
CREATE TABLE public.ic_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_name text,
    email text,
    address text,
    date_of_birth date,
    ndis_number text,
    support_coordinator text,
    allergies text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    support_level text,
    routine text,
    hygiene_support text,
    current_goals text,
    current_medications text,
    general_notes text,
    restrictive_practices text,
    service_providers text,
    house_id uuid,
    photo_url text,
    status ic_status_enum NOT NULL DEFAULT 'draft'::ic_status_enum,
    house_phone text,
    personal_mobile text,
    primary_diagnosis text,
    secondary_diagnosis text,
    behaviour_of_concern text,
    pbsp_engaged boolean,
    bsp_available boolean,
    specialist_name text,
    specialist_phone text,
    specialist_email text,
    restrictive_practice_authorisation boolean,
    restrictive_practice_details text,
    restrictive_practices_yn boolean,
    mtmp_required boolean,
    mtmp_details text,
    mobility_support text,
    meal_prep_support text,
    household_support text,
    communication_type text,
    communication_notes text,
    communication_language_needs text,
    finance_support text,
    health_wellbeing_support text,
    cultural_religious_support text,
    other_support text,
    mental_health_plan text,
    medical_plan text,
    natural_disaster_plan text,
    pharmacy_name text,
    pharmacy_contact text,
    pharmacy_location text,
    gp_name text,
    gp_contact text,
    gp_location text,
    psychiatrist_name text,
    psychiatrist_contact text,
    psychiatrist_location text,
    medical_routine_other text,
    medical_routine_general_process text,
    move_in_date date,
    created_by uuid,
    updated_by uuid,
    track_bowel boolean DEFAULT false,
    track_seizure boolean DEFAULT false,
    track_sleep boolean DEFAULT false,
    track_behaviour boolean DEFAULT false,
    track_community boolean DEFAULT false,
    track_nutrition boolean DEFAULT false,
    track_mtm boolean DEFAULT false,
    track_hygiene boolean DEFAULT false,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_permission_mappings CASCADE;
CREATE TABLE public.ic_permission_mappings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    permission_name text NOT NULL,
    page_id text NOT NULL,
    parent_group text,
    icon_name text,
    display_order integer DEFAULT 0,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_positions CASCADE;
CREATE TABLE public.ic_positions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    department_id uuid,
    title text NOT NULL,
    description text,
    compliance_requirements text[],
    access_level text DEFAULT 'Limited'::text,
    status text DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_provider_participants CASCADE;
CREATE TABLE public.ic_provider_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_providers CASCADE;
CREATE TABLE public.ic_providers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider_name text NOT NULL,
    company text,
    type text,
    phone text,
    email text,
    status text DEFAULT 'Active'::character varying,
    specialties text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_report_preferences CASCADE;
CREATE TABLE public.ic_report_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    report_type text NOT NULL,
    criteria jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_restrictive_practice_types_master CASCADE;
CREATE TABLE public.ic_restrictive_practice_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    organisation_id uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_role_permissions CASCADE;
CREATE TABLE public.ic_role_permissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    role_id uuid NOT NULL,
    my_roster ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    my_timesheets ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    my_leave ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    shift_routines ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participants ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    employees ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    timesheets ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    leave_requests ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    roster_board ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    houses ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    house_checklists ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    access_control ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    master_lists ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    house_management ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    house_operations ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    house_checklist_history ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    house_resources ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    house_staff ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    house_activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_goals ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_behaviour ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_support_needs ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_mealtime ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_medical_routine ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_medications ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_emergency ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_contacts ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_documents ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_shift_notes ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_employment ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_availability ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_emergency ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_compliance ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_training ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_documents ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_roster ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_leave ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_warnings ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_activity_log ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    reporting_clinical ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    reporting_operational ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    reporting_compliance ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    incident_management ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participant_clinical_trackers ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_onboarding ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    admin_compliance ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    admin_onboarding ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    staff_qualifications ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id),
    UNIQUE (role_id)
);
DROP TABLE IF EXISTS public.ic_roles CASCADE;
CREATE TABLE public.ic_roles (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    role_name text NOT NULL,
    description text,
    permissions text[] DEFAULT '{}'::text[],
    assigned_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid,
    updated_by uuid,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_seizure_types_master CASCADE;
CREATE TABLE public.ic_seizure_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_service_participants CASCADE;
CREATE TABLE public.ic_service_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_service_staff CASCADE;
CREATE TABLE public.ic_service_staff (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_services CASCADE;
CREATE TABLE public.ic_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    service_name text NOT NULL,
    type text NOT NULL,
    description text,
    status text DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_shift_assigned_checklists CASCADE;
CREATE TABLE public.ic_shift_assigned_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_id uuid,
    checklist_id uuid NOT NULL,
    assignment_title text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    house_id uuid,
    shift_template_id uuid,
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_shift_note_sleep_records CASCADE;
CREATE TABLE public.ic_shift_note_sleep_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shift_note_id uuid NOT NULL,
    sleep_start_time time without time zone,
    sleep_wake_time time without time zone,
    sleep_type_id uuid,
    sleep_quality_id uuid,
    sleep_support_required text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_shift_notes CASCADE;
CREATE TABLE public.ic_shift_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid,
    staff_id uuid,
    start_date date NOT NULL,
    shift_time text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    full_note text,
    house_id uuid,
    shift_id uuid,
    created_by uuid,
    updated_by uuid,
    shift_type text,
    risks_observed boolean DEFAULT false,
    risk_description text,
    overall_presentation text,
    adl_supports text,
    domestic_tasks text,
    capacity_building_goals text,
    regular_medication_status text,
    prn_medication_given boolean DEFAULT false,
    prn_description text,
    pbs_strategies_used boolean DEFAULT false,
    pbs_strategies_details text,
    pbs_when_used text,
    pbs_outcome text,
    restrictive_practices_status text,
    shift_summary text,
    bowel_movement_occurred boolean DEFAULT false,
    bowel_time time without time zone,
    bowel_bristol_scale integer,
    bowel_notes text,
    seizure_occurred boolean DEFAULT false,
    seizure_time_started time without time zone,
    seizure_duration_minutes integer,
    seizure_type_id uuid,
    seizure_description text,
    seizure_injury_occurred boolean DEFAULT false,
    seizure_injury_description text,
    seizure_emergency_services boolean DEFAULT false,
    seizure_notes text,
    sleep_occurred boolean DEFAULT false,
    behaviour_observed boolean DEFAULT false,
    behaviour_notes text,
    community_access_occurred boolean DEFAULT false,
    community_activity_type text,
    community_location text,
    community_engagement_level text,
    community_notes text,
    meal_provided boolean DEFAULT false,
    nutrition_refusal_alternatives text,
    nutrition_assistance_needed text,
    nutrition_fluids_intake text,
    nutrition_notes text,
    mtm_meal_provided boolean DEFAULT false,
    mtm_texture_correct boolean,
    mtm_consistency_correct boolean,
    mtm_positioning_appropriate boolean,
    mtm_supervision_required boolean,
    mtm_meal_intake_notes text,
    mtm_fluid_intake_notes text,
    mtm_concerns text,
    mtm_notes text,
    hygiene_support_required boolean DEFAULT false,
    hygiene_observed_concerns text,
    hygiene_notes text,
    status ic_status_enum NOT NULL DEFAULT 'active'::ic_status_enum,
    mtm_texture_notes text,
    mtm_consistency_notes text,
    mtm_positioning_notes text,
    mtm_supervision_notes text,
    reference_id text,
    behaviour_intensity_id uuid,
    nutrition_meal_type_id uuid,
    nutrition_intake_id uuid,
    mtm_diet_type_id uuid,
    mtm_fluids_id uuid,
    mtm_meal_intake_id uuid,
    mtm_fluid_intake_id uuid,
    mtm_swallowing_concerns_id uuid,
    hygiene_shower_id uuid,
    hygiene_oral_care_id uuid,
    hygiene_toileting_id uuid,
    hygiene_grooming_id uuid,
    bowel_amount_id uuid,
    bowel_assistance_id uuid,
    behaviour_type text,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_shift_participants CASCADE;
CREATE TABLE public.ic_shift_participants (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_shift_template_checklists CASCADE;
CREATE TABLE public.ic_shift_template_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_template_id uuid NOT NULL,
    checklist_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_shift_template_default_checklists CASCADE;
CREATE TABLE public.ic_shift_template_default_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_template_id uuid NOT NULL,
    checklist_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_sleep_quality_master CASCADE;
CREATE TABLE public.ic_sleep_quality_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_sleep_types_master CASCADE;
CREATE TABLE public.ic_sleep_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff CASCADE;
CREATE TABLE public.ic_staff (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_name text,
    email text,
    phone text,
    hire_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    date_of_birth text,
    address text,
    emergency_contact_name text,
    emergency_contact_phone text,
    notes text,
    branch_id uuid,
    role_id uuid,
    status ic_status_enum NOT NULL DEFAULT 'draft'::ic_status_enum,
    hobbies text,
    allergies text,
    availability text,
    department_id uuid,
    employment_type_id uuid,
    manager_id uuid,
    separation_date date,
    auth_user_id uuid,
    photo_url text,
    created_by uuid,
    updated_by uuid,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id),
    UNIQUE (email),
    UNIQUE (auth_user_id)
);
DROP TABLE IF EXISTS public.ic_staff_availability CASCADE;
CREATE TABLE public.ic_staff_availability (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    type text NOT NULL,
    day_of_week integer,
    start_date date,
    start_time time without time zone NOT NULL DEFAULT '00:00:00'::time without time zone,
    end_time time without time zone NOT NULL DEFAULT '23:59:59'::time without time zone,
    is_available boolean NOT NULL DEFAULT false,
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    end_date date,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_compliance CASCADE;
CREATE TABLE public.ic_staff_compliance (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    completion_date date,
    expiry_date date,
    status ic_compliance_status_enum DEFAULT 'in_progress'::ic_compliance_status_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    compliance_type_id uuid NOT NULL,
    comments text,
    document_number text,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_compliance_documents CASCADE;
CREATE TABLE public.ic_staff_compliance_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_compliance_id uuid NOT NULL,
    document_type uuid,
    document_number text,
    expiry_date date,
    file_name text,
    file_path text,
    points integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    comments text,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_document_roles CASCADE;
CREATE TABLE public.ic_staff_document_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    role_id uuid NOT NULL,
    access_level ic_access_level_enum NOT NULL DEFAULT 'read_only'::ic_access_level_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_documents CASCADE;
CREATE TABLE public.ic_staff_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_onboarding CASCADE;
CREATE TABLE public.ic_staff_onboarding (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    onboarding_item_id uuid NOT NULL,
    is_complete boolean NOT NULL DEFAULT false,
    comments text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_organisations CASCADE;
CREATE TABLE public.ic_staff_organisations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    organisation_id uuid NOT NULL,
    role_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_qualifications CASCADE;
CREATE TABLE public.ic_staff_qualifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    title text NOT NULL,
    institution text,
    date_completed date,
    expiry_date date,
    file_name text,
    file_path text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_shifts CASCADE;
CREATE TABLE public.ic_staff_shifts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    staff_id uuid,
    start_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    house_id uuid,
    shift_template text NOT NULL DEFAULT 'SIL'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    end_date date NOT NULL DEFAULT CURRENT_DATE,
    template_item_id uuid,
    shift_template_id uuid,
    created_by uuid,
    updated_by uuid,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_staff_training CASCADE;
CREATE TABLE public.ic_staff_training (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    staff_id uuid,
    title text NOT NULL,
    category text NOT NULL,
    description text,
    provider text,
    date_completed date,
    expiry_date date,
    file_path text,
    file_name text,
    file_size integer,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    PRIMARY KEY (id)
);
DROP TABLE IF EXISTS public.ic_timesheets CASCADE;
CREATE TABLE public.ic_timesheets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    shift_id uuid,
    clock_in timestamp with time zone NOT NULL,
    clock_out timestamp with time zone NOT NULL,
    break_minutes integer NOT NULL DEFAULT 0,
    notes text,
    status text NOT NULL DEFAULT 'pending'::text,
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    overtime_hours numeric NOT NULL DEFAULT 0,
    overtime_explanation text,
    travel_km numeric NOT NULL DEFAULT 0,
    incident_tag boolean NOT NULL DEFAULT false,
    sick_shift boolean NOT NULL DEFAULT false,
    shift_notes_text text,
    submitted_at timestamp with time zone,
    rejection_reason text,
    approved_at timestamp with time zone,
    approved_by uuid,
    late_submission boolean NOT NULL DEFAULT false,
    created_by uuid,
    updated_by uuid,
    participant_km numeric NOT NULL DEFAULT 0,
    participant_km_description text,
    travel_km_description text,
    organisation_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    PRIMARY KEY (id),
    UNIQUE (shift_id, staff_id)
);
DROP TABLE IF EXISTS public.ic_user_roles CASCADE;
CREATE TABLE public.ic_user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    role_name text NOT NULL,
    permissions jsonb,
    assigned_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);

-- 3. Foreign Keys
ALTER TABLE public.ic_activity_log ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_activity_log ADD CONSTRAINT activity_log_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_branch_policies ADD CONSTRAINT branch_policies_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.ic_branches(id);
ALTER TABLE public.ic_checklist_item_master ADD CONSTRAINT checklist_item_master_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.ic_checklist_master(id);
ALTER TABLE public.ic_checklist_item_master ADD CONSTRAINT checklist_item_master_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_checklist_schedules ADD CONSTRAINT checklist_schedules_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_checklist_schedules ADD CONSTRAINT checklist_schedules_house_checklist_id_fkey FOREIGN KEY (house_checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_compliance_types_master ADD CONSTRAINT compliance_types_master_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_house_calendar_event_attachments ADD CONSTRAINT house_calendar_event_attachments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_calendar_event_participants ADD CONSTRAINT house_calendar_event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_calendar_event_participants ADD CONSTRAINT house_calendar_event_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_house_calendar_event_staff ADD CONSTRAINT house_calendar_event_staff_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_calendar_event_staff ADD CONSTRAINT house_calendar_event_staff_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_checklist_schedule_id_fkey FOREIGN KEY (checklist_schedule_id) REFERENCES public.ic_checklist_schedules(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_house_checklist_id_fkey FOREIGN KEY (house_checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_event_type_id_fkey FOREIGN KEY (event_type_id) REFERENCES public.ic_house_calendar_event_types_master(id);
ALTER TABLE public.ic_house_checklist_item_attachments ADD CONSTRAINT house_checklist_item_attachments_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.ic_house_checklist_items(id);
ALTER TABLE public.ic_house_checklist_item_attachments ADD CONSTRAINT house_checklist_item_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.ic_house_checklist_submissions(id);
ALTER TABLE public.ic_house_checklist_item_attachments ADD CONSTRAINT house_checklist_item_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_checklist_items ADD CONSTRAINT house_checklist_items_master_item_id_fkey FOREIGN KEY (master_item_id) REFERENCES public.ic_checklist_item_master(id);
ALTER TABLE public.ic_house_checklist_items ADD CONSTRAINT house_checklist_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_house_checklist_items ADD CONSTRAINT house_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.ic_house_checklist_submissions(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_master_item_id_fkey FOREIGN KEY (master_item_id) REFERENCES public.ic_checklist_item_master(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.ic_house_checklist_items(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.ic_checklist_master(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_shift_assignment_id_fkey FOREIGN KEY (shift_assignment_id) REFERENCES public.ic_shift_assigned_checklists(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_calendar_event_id_fkey FOREIGN KEY (calendar_event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_checklists ADD CONSTRAINT house_checklists_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.ic_checklist_master(id);
ALTER TABLE public.ic_house_checklists ADD CONSTRAINT house_checklists_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_house_checklists ADD CONSTRAINT house_checklists_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_comms ADD CONSTRAINT house_comms_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_files ADD CONSTRAINT house_files_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_files ADD CONSTRAINT house_files_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_files ADD CONSTRAINT house_files_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.ic_house_forms(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.ic_house_forms(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.ic_house_form_assignments(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_house_forms ADD CONSTRAINT house_forms_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_resources ADD CONSTRAINT house_resources_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_house_resources ADD CONSTRAINT house_resources_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_shift_templates ADD CONSTRAINT house_shift_templates_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_shift_templates ADD CONSTRAINT house_shift_templates_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_house_staff_assignments ADD CONSTRAINT house_staff_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_staff_assignments ADD CONSTRAINT house_staff_assignments_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_houses ADD CONSTRAINT houses_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_houses ADD CONSTRAINT houses_house_type_id_fkey FOREIGN KEY (house_type_id) REFERENCES public.ic_house_types_master(id);
ALTER TABLE public.ic_houses ADD CONSTRAINT houses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.ic_branches(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_incident_type_id_fkey FOREIGN KEY (incident_type_id) REFERENCES public.ic_incident_types_master(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_involved_staff_id_fkey FOREIGN KEY (involved_staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_involved_participant_id_fkey FOREIGN KEY (involved_participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_restrictive_practice_type_id_fkey FOREIGN KEY (restrictive_practice_type_id) REFERENCES public.ic_restrictive_practice_types_master(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_incident_reports ADD CONSTRAINT incident_reports_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_incident_types_master ADD CONSTRAINT incident_types_master_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_leave_requests ADD CONSTRAINT leave_requests_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_leave_requests ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.ic_leave_types(id);
ALTER TABLE public.ic_medication_types_master ADD CONSTRAINT medication_types_master_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_medications_master ADD CONSTRAINT medications_master_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.ic_medication_types_master(id);
ALTER TABLE public.ic_notifications ADD CONSTRAINT notifications_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_participant_contacts ADD CONSTRAINT participant_contacts_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_contacts ADD CONSTRAINT participant_contacts_contact_type_id_fkey FOREIGN KEY (contact_type_id) REFERENCES public.ic_contact_types_master(id);
ALTER TABLE public.ic_participant_document_roles ADD CONSTRAINT participant_document_roles_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.ic_participant_documents(id);
ALTER TABLE public.ic_participant_document_roles ADD CONSTRAINT participant_document_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_participant_documents ADD CONSTRAINT participant_documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participant_documents ADD CONSTRAINT participant_documents_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_documents ADD CONSTRAINT participant_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participant_forms ADD CONSTRAINT participant_forms_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participant_forms ADD CONSTRAINT participant_forms_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_goal_progress ADD CONSTRAINT participant_goal_progress_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.ic_participant_goals(id);
ALTER TABLE public.ic_participant_goals ADD CONSTRAINT participant_goals_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_hygiene_routines ADD CONSTRAINT participant_hygiene_routines_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_medications ADD CONSTRAINT participant_medications_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_medications ADD CONSTRAINT participant_medications_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.ic_medications_master(id);
ALTER TABLE public.ic_participant_notes ADD CONSTRAINT participant_notes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_restrictive_practices ADD CONSTRAINT participant_restrictive_practices_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participants ADD CONSTRAINT participants_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_participants ADD CONSTRAINT participants_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_positions ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.ic_departments(id);
ALTER TABLE public.ic_provider_participants ADD CONSTRAINT provider_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_report_preferences ADD CONSTRAINT report_preferences_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_restrictive_practice_types_master ADD CONSTRAINT restrictive_practice_types_master_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_role_permissions ADD CONSTRAINT role_permissions_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_roles ADD CONSTRAINT roles_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_service_participants ADD CONSTRAINT service_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_service_participants ADD CONSTRAINT service_participants_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.ic_services(id);
ALTER TABLE public.ic_service_staff ADD CONSTRAINT service_staff_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.ic_services(id);
ALTER TABLE public.ic_service_staff ADD CONSTRAINT service_staff_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_shift_note_sleep_records ADD CONSTRAINT shift_note_sleep_records_shift_note_id_fkey FOREIGN KEY (shift_note_id) REFERENCES public.ic_shift_notes(id);
ALTER TABLE public.ic_shift_note_sleep_records ADD CONSTRAINT shift_note_sleep_records_sleep_quality_id_fkey FOREIGN KEY (sleep_quality_id) REFERENCES public.ic_sleep_quality_master(id);
ALTER TABLE public.ic_shift_note_sleep_records ADD CONSTRAINT shift_note_sleep_records_sleep_type_id_fkey FOREIGN KEY (sleep_type_id) REFERENCES public.ic_sleep_types_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_seizure_type_id_fkey FOREIGN KEY (seizure_type_id) REFERENCES public.ic_seizure_types_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_nutrition_meal_type_id_fkey FOREIGN KEY (nutrition_meal_type_id) REFERENCES public.ic_nutrition_meal_types_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_nutrition_intake_id_fkey FOREIGN KEY (nutrition_intake_id) REFERENCES public.ic_nutrition_intake_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_mtm_swallowing_concerns_id_fkey FOREIGN KEY (mtm_swallowing_concerns_id) REFERENCES public.ic_mtm_swallowing_concerns_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_mtm_meal_intake_id_fkey FOREIGN KEY (mtm_meal_intake_id) REFERENCES public.ic_mtm_meal_intake_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_mtm_fluids_id_fkey FOREIGN KEY (mtm_fluids_id) REFERENCES public.ic_mtm_fluids_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_mtm_fluid_intake_id_fkey FOREIGN KEY (mtm_fluid_intake_id) REFERENCES public.ic_mtm_fluid_intake_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_mtm_diet_type_id_fkey FOREIGN KEY (mtm_diet_type_id) REFERENCES public.ic_mtm_diet_types_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_hygiene_toileting_id_fkey FOREIGN KEY (hygiene_toileting_id) REFERENCES public.ic_hygiene_levels_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_hygiene_shower_id_fkey FOREIGN KEY (hygiene_shower_id) REFERENCES public.ic_hygiene_levels_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_hygiene_oral_care_id_fkey FOREIGN KEY (hygiene_oral_care_id) REFERENCES public.ic_hygiene_levels_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_hygiene_grooming_id_fkey FOREIGN KEY (hygiene_grooming_id) REFERENCES public.ic_hygiene_levels_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_bowel_assistance_id_fkey FOREIGN KEY (bowel_assistance_id) REFERENCES public.ic_bowel_assistance_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_bowel_amount_id_fkey FOREIGN KEY (bowel_amount_id) REFERENCES public.ic_bowel_amounts_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_behaviour_intensity_id_fkey FOREIGN KEY (behaviour_intensity_id) REFERENCES public.ic_behaviour_intensity_master(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_shift_participants ADD CONSTRAINT shift_participants_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_shift_participants ADD CONSTRAINT shift_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_shift_template_checklists ADD CONSTRAINT shift_template_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_shift_template_default_checklists ADD CONSTRAINT shift_template_default_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_shift_template_default_checklists ADD CONSTRAINT shift_template_default_checklists_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.ic_departments(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_employment_type_id_fkey FOREIGN KEY (employment_type_id) REFERENCES public.ic_employment_types_master(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_staff_availability ADD CONSTRAINT staff_availability_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_compliance ADD CONSTRAINT staff_compliance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_compliance ADD CONSTRAINT staff_compliance_compliance_type_id_fkey FOREIGN KEY (compliance_type_id) REFERENCES public.ic_compliance_types_master(id);
ALTER TABLE public.ic_staff_compliance_documents ADD CONSTRAINT staff_compliance_documents_document_type_fkey FOREIGN KEY (document_type) REFERENCES public.ic_id_document_types(id);
ALTER TABLE public.ic_staff_compliance_documents ADD CONSTRAINT staff_compliance_documents_staff_compliance_id_fkey FOREIGN KEY (staff_compliance_id) REFERENCES public.ic_staff_compliance(id);
ALTER TABLE public.ic_staff_document_roles ADD CONSTRAINT staff_document_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_staff_document_roles ADD CONSTRAINT staff_document_roles_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.ic_staff_documents(id);
ALTER TABLE public.ic_staff_documents ADD CONSTRAINT staff_documents_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_documents ADD CONSTRAINT staff_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_documents ADD CONSTRAINT staff_documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_onboarding ADD CONSTRAINT staff_onboarding_onboarding_item_id_fkey FOREIGN KEY (onboarding_item_id) REFERENCES public.ic_onboarding_items_master(id);
ALTER TABLE public.ic_staff_onboarding ADD CONSTRAINT staff_onboarding_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_organisations ADD CONSTRAINT staff_organisations_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_organisations ADD CONSTRAINT staff_organisations_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_staff_organisations ADD CONSTRAINT staff_organisations_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_staff_qualifications ADD CONSTRAINT staff_qualifications_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_training ADD CONSTRAINT staff_training_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.ic_organisations(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_user_roles ADD CONSTRAINT user_roles_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);

-- 4. Postgres Functions
CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func() RETURNS trigger AS $$
DECLARE
    target_data JSONB;
    entity_name_val TEXT;
    user_name_val TEXT;
    acting_staff_id UUID;
BEGIN
    acting_staff_id := public.ic_jwt_get_staff_id();
    
    -- Resolve acting user name
    SELECT staff_name INTO user_name_val FROM public.ic_staff WHERE id = acting_staff_id LIMIT 1;
    
    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    -- Resolve Entity Name (Primary Check)
    entity_name_val := COALESCE(
        target_data->>'reference_id',
        target_data->>'title',
        target_data->>'file_name',
        target_data->>'staff_name', 
        target_data->>'participant_name',
        target_data->>'name'
    );

    -- Resolve names for ID-only records dynamically from master tables
    IF entity_name_val IS NULL THEN
        IF TG_TABLE_NAME = 'ic_staff_compliance' THEN
            SELECT compliance_name INTO entity_name_val FROM public.ic_compliance_types_master WHERE id = (target_data->>'compliance_type_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_staff_onboarding' THEN
            SELECT item_name INTO entity_name_val FROM public.ic_onboarding_items_master WHERE id = (target_data->>'onboarding_item_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_participant_medications' THEN
            SELECT medication_name INTO entity_name_val FROM public.ic_medications_master WHERE id = (target_data->>'medication_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_staff_availability' THEN
            SELECT staff_name || ' Availability' INTO entity_name_val FROM public.ic_staff WHERE id = (target_data->>'staff_id')::uuid;
        END IF;
    END IF;

    -- Standard Audit Log Insertion
    INSERT INTO public.ic_activity_log (
        activity_type, entity_type, entity_id, entity_name, description, user_name, user_id
    ) VALUES (
        LOWER(TG_OP), REPLACE(TG_TABLE_NAME, 'ic_', ''), (target_data->>'id'), entity_name_val, 
        INITCAP(TG_OP) || ' ' || REPLACE(TG_TABLE_NAME, 'ic_', '') || ': ' || COALESCE(entity_name_val, 'ID ' || (target_data->>'id')),
        COALESCE(user_name_val, 'System'), acting_staff_id
    );

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_dispatch_jwt_sync_webhook() RETURNS trigger AS $$
DECLARE
  v_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- Auto-Discovery Pattern:
  -- 1. Try custom app settings
  -- 2. Fallback to vault or request headers
  v_url := COALESCE(
    current_setting('app.settings.supabase_url', true),
    'https://' || current_setting('request.header.host', true)
  );
  
  v_anon_key := COALESCE(
    current_setting('app.settings.supabase_anon_key', true),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)
  );

  -- SECURITY & STABILITY: Fail-safe skip if configuration is missing.
  -- Prevents a missing setting from blocking a Staff record save.
  IF v_url IS NULL OR v_url = '' OR v_anon_key IS NULL OR v_anon_key = 'YOUR_ANON_KEY' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/ic-update-user-roles',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_anon_key),
    body := jsonb_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'record', row_to_json(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END)::jsonb)
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_get_organisation_id() RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'active_organisation_id')::UUID,
    (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID
  );
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) RETURNS text AS $$
DECLARE
  v_perm_text text;
  v_role_id uuid;
  v_jwt jsonb;
BEGIN
  -- Cache JWT once for performance
  v_jwt := auth.jwt();

  -- PATH 1: JWT PERFORMANCE PATH (Primary - Instant)
  v_perm_text := v_jwt -> 'app_metadata' -> 'permissions' ->> p_module;
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- PATH 2: DYNAMIC DATABASE FALLBACK (Resilient)
  -- 2a. Resolve Role Identity (Check JWT first, then DB)
  v_role_id := (v_jwt -> 'app_metadata' ->> 'role_id')::uuid;
  IF v_role_id IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.ic_staff WHERE auth_user_id = auth.uid() LIMIT 1;
  END IF;

  -- 2b. JSONB Lookup (Prevents "Undefined Column" errors if a module is missing from the table)
  IF v_role_id IS NOT NULL THEN
    SELECT (to_jsonb(rp) ->> p_module) INTO v_perm_text
    FROM public.ic_role_permissions rp
    WHERE rp.role_id = v_role_id;
  END IF;

  -- Default to 'none' if module is missing from table or value is null
  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.ic_jwt_get_role_id() RETURNS uuid AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_get_staff_id() RETURNS uuid AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Try JWT first
  BEGIN
    v_staff_id := (auth.jwt() -> 'app_metadata' ->> 'staff_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_staff_id := NULL;
  END;

  IF v_staff_id IS NOT NULL THEN
    RETURN v_staff_id;
  END IF;

  -- Fallback to database lookup
  SELECT id INTO v_staff_id 
  FROM public.ic_staff 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;

  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.ic_jwt_has_house(p_house_id uuid) RETURNS bool AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text), 
    false
  );
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_has_house_internal(p_house_id uuid) RETURNS bool AS $$
BEGIN
  -- Check JWT metadata (Fast & Safe)
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;

  -- Fallback to DB (Safe because it's a direct ID lookup)
  RETURN EXISTS (
    SELECT 1 FROM public.ic_house_staff_assignments
    WHERE house_id = p_house_id 
    AND staff_id = public.ic_jwt_get_staff_id()
  );
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_is_admin() RETURNS bool AS $$
BEGIN
  RETURN (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true OR
    public.ic_jwt_get_perm('access_control') = 'full'
  );
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_manages_staff(p_staff_id uuid) RETURNS bool AS $$
BEGIN
  -- Admin always manages everyone
  IF public.ic_jwt_is_admin() THEN
    RETURN true;
  END IF;

  -- Staff member manages themselves
  IF p_staff_id = public.ic_jwt_get_staff_id() THEN
    RETURN true;
  END IF;

  -- Managers can see staff in houses they are assigned to
  RETURN EXISTS (
    SELECT 1 
    FROM public.ic_house_staff_assignments hsa_target
    JOIN public.ic_house_staff_assignments hsa_manager ON hsa_manager.house_id = hsa_target.house_id
    WHERE hsa_target.staff_id = p_staff_id
    AND hsa_manager.staff_id = public.ic_jwt_get_staff_id()
    AND public.ic_jwt_get_perm('employees') IN ('context_read_write', 'context_read_only')
  );
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_propagate_role_sync_webhook() RETURNS trigger AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  FOR v_staff_id IN SELECT id FROM ic_staff WHERE role_id = NEW.role_id LOOP
    PERFORM net.http_post(
        url := 'https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_ANON_KEY' -- 👈 Handled in Prod via migration search/replace
        ),
        body := jsonb_build_object(
            'table', 'ic_staff',
            'type', 'UPDATE',
            'userId', (SELECT auth_user_id FROM ic_staff WHERE id = v_staff_id)
        )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_set_audit_columns() RETURNS trigger AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Get staff identity from session (JWT or DB lookup fallback)
  v_staff_id := public.ic_jwt_get_staff_id();

  IF (TG_OP = 'INSERT') THEN
    NEW.created_at := now();
    NEW.updated_at := now();
    -- Set audit IDs if not provided (allows for controlled seed data/migrations)
    IF NEW.created_by IS NULL THEN
        NEW.created_by := v_staff_id;
    END IF;
    IF NEW.updated_by IS NULL THEN
        NEW.updated_by := v_staff_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    NEW.updated_at := now();
    NEW.updated_by := v_staff_id;
    
    -- Safety: Preserve immutability of creation data (Immutability Layer)
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_trigger_auto_link_staff_to_auth() RETURNS trigger AS $$
BEGIN
  -- If auth_user_id is already set, do nothing
  IF NEW.auth_user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Attempt to find the user in auth.users by email
  -- Note: We assume the email is stored in a column named 'email' on ic_staff
  SELECT id INTO NEW.auth_user_id
  FROM auth.users
  WHERE email = NEW.email
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.ic_update_house_checklist_items_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_update_house_checklists_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_update_house_files_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_update_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_branch_documents', 'ic_branch_documents', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_checklist_attachments', 'ic_checklist_attachments', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_house_documents', 'ic_house_documents', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_participant_documents', 'ic_participant_documents', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_participant_photos', 'ic_participant_photos', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_staff_documents', 'ic_staff_documents', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_staff_photos', 'ic_staff_photos', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_house_resources', 'ic_house_resources', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('ic_id_documents', 'ic_id_documents', false) ON CONFLICT (id) DO UPDATE SET public = false;

-- 6. Triggers
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branch_policies;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branch_policies;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branch_policies;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_branch_policies;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_branch_policies;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branches;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branches;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branches;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_branches;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_branches;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_item_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_item_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_item_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_item_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_item_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_schedules;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_schedules;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_schedules;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_schedules;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_schedules;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_compliance_types_master;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_compliance_types_master;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_compliance_types_master;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_compliance_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_compliance_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_compliance_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_contact_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_contact_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_contact_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_contact_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_contact_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_departments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_departments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_departments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_departments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_departments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_employment_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_employment_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_employment_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_employment_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_employment_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_error_logs;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_error_logs FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_error_logs;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_error_logs FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_error_logs;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_error_logs FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_events;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_events;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_events;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_events;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_events;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_comms;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_comms;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_comms;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_comms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_comms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_files;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_files;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_files;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_files;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_files;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_assignments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_assignments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_resources;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_resources;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_resources;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_resources;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_resources;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_shift_templates;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_shift_templates;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_shift_templates;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_shift_templates;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_shift_templates;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments AFTER UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments AFTER INSERT ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments AFTER DELETE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS sync_jwt_on_assignment_change ON public.ic_house_staff_assignments;
CREATE TRIGGER sync_jwt_on_assignment_change AFTER DELETE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rdnaqrzqpcicskylmsyl.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmFxcnpxcGNpY3NreWxtc3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1NDM5MSwiZXhwIjoyMDg3MzMwMzkxfQ.bR9MwbQY0QpjvcNJF14-FFPhAiEjpvjH3_KQzyu31ZQ"}', '{}', '5000');
DROP TRIGGER IF EXISTS sync_jwt_on_assignment_change ON public.ic_house_staff_assignments;
CREATE TRIGGER sync_jwt_on_assignment_change AFTER UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rdnaqrzqpcicskylmsyl.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmFxcnpxcGNpY3NreWxtc3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1NDM5MSwiZXhwIjoyMDg3MzMwMzkxfQ.bR9MwbQY0QpjvcNJF14-FFPhAiEjpvjH3_KQzyu31ZQ"}', '{}', '5000');
DROP TRIGGER IF EXISTS sync_jwt_on_assignment_change ON public.ic_house_staff_assignments;
CREATE TRIGGER sync_jwt_on_assignment_change AFTER INSERT ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rdnaqrzqpcicskylmsyl.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmFxcnpxcGNpY3NreWxtc3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1NDM5MSwiZXhwIjoyMDg3MzMwMzkxfQ.bR9MwbQY0QpjvcNJF14-FFPhAiEjpvjH3_KQzyu31ZQ"}', '{}', '5000');
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_houses;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_houses;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_houses;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_houses;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_houses;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_id_document_types;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_id_document_types;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_id_document_types;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_id_document_types;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_id_document_types;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_id_document_types FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_reports;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_incident_reports FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_reports;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_incident_reports FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_reports;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_incident_reports FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_incident_reports;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_incident_reports FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_incident_reports;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_incident_reports FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_incident_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_incident_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_incident_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_incident_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_incident_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_incident_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_incident_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_incident_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_requests;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_requests;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_requests;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_requests;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_requests;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_types;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_types;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_types;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_types;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_types;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_medication_types_master;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_medication_types_master;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_medication_types_master;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_medication_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_medication_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_medication_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_medications_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_medications_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_medications_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_medications_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_medications_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_notifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_notifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_notifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_notifications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_notifications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_onboarding_items_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_onboarding_items_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_onboarding_items_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_onboarding_items_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_onboarding_items_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_onboarding_items_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_onboarding_items_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_onboarding_items_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_onboarding_items_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_onboarding_items_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_organisations;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_organisations FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_organisations;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_organisations FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_organisations;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_organisations FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_organisations;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_organisations FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_organisations;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_organisations FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_contacts;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_contacts;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_contacts;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_contacts;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_contacts;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_document_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_document_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_document_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_document_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goals;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goals;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goals;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goals;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goals;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_participant_hygiene_updated_at ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_update_participant_hygiene_updated_at BEFORE UPDATE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_medications;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_medications;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_medications;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_medications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_medications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_restrictive_practices;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_restrictive_practices FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_restrictive_practices;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_restrictive_practices FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_restrictive_practices;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_restrictive_practices FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_restrictive_practices;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_restrictive_practices FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_restrictive_practices;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_restrictive_practices FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_permission_mappings;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_permission_mappings;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_permission_mappings;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_permission_mappings;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_permission_mappings;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_positions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_positions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_positions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_positions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_positions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_provider_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_provider_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_provider_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_provider_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_provider_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_providers;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_providers;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_providers;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_providers;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_providers;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_restrictive_practice_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_restrictive_practice_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_restrictive_practice_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_restrictive_practice_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_restrictive_practice_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_restrictive_practice_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_restrictive_practice_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_restrictive_practice_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_restrictive_practice_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_restrictive_practice_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_role_permissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_role_permissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_role_permissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_propagate_role_permission_changes ON public.ic_role_permissions;
CREATE TRIGGER ic_propagate_role_permission_changes AFTER UPDATE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_propagate_role_sync_webhook();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_role_permissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_role_permissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_seizure_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_seizure_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_seizure_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_seizure_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_seizure_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_service_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_service_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_service_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_service_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_service_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_service_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_service_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_service_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_service_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_services;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_services;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_services;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_services;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_services;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_sleep_records_audit_columns ON public.ic_shift_note_sleep_records;
CREATE TRIGGER ic_trigger_set_sleep_records_audit_columns BEFORE UPDATE ON public.ic_shift_note_sleep_records FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_sleep_records_audit_columns ON public.ic_shift_note_sleep_records;
CREATE TRIGGER ic_trigger_set_sleep_records_audit_columns BEFORE INSERT ON public.ic_shift_note_sleep_records FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_auto_link_staff ON public.ic_staff;
CREATE TRIGGER ic_trigger_auto_link_staff BEFORE INSERT ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_trigger_auto_link_staff_to_auth();
DROP TRIGGER IF EXISTS ic_trigger_auto_link_staff ON public.ic_staff;
CREATE TRIGGER ic_trigger_auto_link_staff BEFORE UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_trigger_auto_link_staff_to_auth();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_webhook_jwt_staff ON public.ic_staff;
CREATE TRIGGER ic_webhook_jwt_staff AFTER INSERT ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS ic_webhook_jwt_staff ON public.ic_staff;
CREATE TRIGGER ic_webhook_jwt_staff AFTER DELETE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS ic_webhook_jwt_staff ON public.ic_staff;
CREATE TRIGGER ic_webhook_jwt_staff AFTER UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS sync_jwt_on_staff_change ON public.ic_staff;
CREATE TRIGGER sync_jwt_on_staff_change AFTER UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://rdnaqrzqpcicskylmsyl.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmFxcnpxcGNpY3NreWxtc3lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1NDM5MSwiZXhwIjoyMDg3MzMwMzkxfQ.bR9MwbQY0QpjvcNJF14-FFPhAiEjpvjH3_KQzyu31ZQ"}', '{}', '5000');
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_availability;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_availability FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_availability;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_availability FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_availability;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_availability FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_availability;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_availability FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_availability;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_availability FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_compliance;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_compliance;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_compliance;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_compliance;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_compliance;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_delete ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_audit_universal_trigger_delete AFTER DELETE ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_insert ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_audit_universal_trigger_insert AFTER INSERT ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger_update ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_audit_universal_trigger_update AFTER UPDATE ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_insert ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_trigger_set_audit_columns_insert BEFORE INSERT ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_update ON public.ic_staff_compliance_documents;
CREATE TRIGGER ic_trigger_set_audit_columns_update BEFORE UPDATE ON public.ic_staff_compliance_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_document_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_document_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_document_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_document_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_onboarding;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_onboarding FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_onboarding;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_onboarding FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_onboarding;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_onboarding FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_onboarding;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_onboarding FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_onboarding;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_onboarding FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_organisations;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_organisations FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_organisations;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_organisations FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_organisations;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_organisations FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_organisations;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_organisations FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_organisations;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_organisations FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_qualifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_qualifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_qualifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS set_ic_staff_qualifications_audit ON public.ic_staff_qualifications;
CREATE TRIGGER set_ic_staff_qualifications_audit BEFORE UPDATE ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS set_ic_staff_qualifications_audit ON public.ic_staff_qualifications;
CREATE TRIGGER set_ic_staff_qualifications_audit BEFORE INSERT ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_shifts;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_shifts;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_shifts;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_shifts;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_shifts;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_training;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_training FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_training;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_training FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_training;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_training FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_training;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_training FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_training;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_training FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_timesheets;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_timesheets;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_timesheets;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_timesheets;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_timesheets;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_user_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_user_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_user_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_user_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_user_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();

COMMIT;
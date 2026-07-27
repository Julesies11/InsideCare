-- InsideCare Baseline Migration
-- Generated from docs/database_schema
-- Date: 2026-05-26
BEGIN;

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Enums
DROP TYPE IF EXISTS public.ic_access_level_enum CASCADE;
CREATE TYPE public.ic_access_level_enum AS ENUM ('full', 'context_read_write', 'context_read_only', 'read_only', 'none');
DROP TYPE IF EXISTS public.ic_shift_period_enum CASCADE;
CREATE TYPE public.ic_shift_period_enum AS ENUM ('morning', 'day', 'night', 'all');
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_activity_log ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_branch_policies ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_branches ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_checklist_item_master ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_checklist_master ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_checklist_schedules ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_contact_types_master ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_departments ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_employment_types_master ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_error_logs ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_funding_sources_master CASCADE;
CREATE TABLE public.ic_funding_sources_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    funding_source_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_funding_sources_master ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_funding_types_master CASCADE;
CREATE TABLE public.ic_funding_types_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    funding_type_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_funding_types_master ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_house_calendar_event_attachments ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_house_calendar_event_participants CASCADE;
CREATE TABLE public.ic_house_calendar_event_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_house_calendar_event_participants ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_house_calendar_event_staff CASCADE;
CREATE TABLE public.ic_house_calendar_event_staff (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_house_calendar_event_staff ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_calendar_event_types_master ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_calendar_events ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_checklist_item_attachments ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_checklist_items ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_checklist_submission_items ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_checklist_submissions ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_house_checklists ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_comms ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_files ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_form_assignments ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_form_submissions ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_forms ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_house_resources CASCADE;
CREATE TABLE public.ic_house_resources (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid,
    title text NOT NULL,
    category text NOT NULL,
    type text NOT NULL,
    description text,
    priority text DEFAULT 'Medium'::text,
    phone text,
    address text,
    file_url text,
    file_name text,
    file_size integer,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_house_resources ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_house_shift_templates ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_staff_assignments ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_house_types_master ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_houses ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_leave_requests ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_leave_types CASCADE;
CREATE TABLE public.ic_leave_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    leave_type_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_leave_types ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_medications_master CASCADE;
CREATE TABLE public.ic_medications_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    medication_name text NOT NULL,
    category text,
    common_dosages text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    side_effects text,
    interactions text,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_medications_master ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_notifications ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_participant_contacts ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_participant_documents CASCADE;
CREATE TABLE public.ic_participant_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_by uuid,
    is_restricted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_participant_documents ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_participant_forms ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_participant_funding CASCADE;
CREATE TABLE public.ic_participant_funding (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    house_id uuid,
    code text,
    invoice_recipient text,
    allocated_amount numeric NOT NULL,
    used_amount numeric DEFAULT 0,
    remaining_amount numeric,
    status text DEFAULT 'Active'::text,
    end_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    funding_source_id uuid,
    funding_type_id uuid,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_participant_funding ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_participant_goal_progress ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_participant_goals ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_participant_hygiene_routines ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_participant_medications CASCADE;
CREATE TABLE public.ic_participant_medications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL,
    dosage text,
    frequency text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    medication_id uuid,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_participant_medications ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_participant_notes ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_participant_restrictive_practices ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_participants ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_permission_mappings ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_positions ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_provider_participants CASCADE;
CREATE TABLE public.ic_provider_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_provider_participants ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_providers ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_role_permissions CASCADE;
CREATE TABLE public.ic_role_permissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    role_id uuid NOT NULL,
    my_roster ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    my_timesheets ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    my_leave ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    shift_routines ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    participants ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
    shift_notes ic_access_level_enum NOT NULL DEFAULT 'none'::ic_access_level_enum,
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
    PRIMARY KEY (id),
    UNIQUE (role_id)
);
ALTER TABLE public.ic_role_permissions ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_roles ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_service_participants CASCADE;
CREATE TABLE public.ic_service_participants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_service_participants ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_service_staff CASCADE;
CREATE TABLE public.ic_service_staff (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_service_staff ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_services ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_shift_assigned_checklists ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_shift_notes ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_shift_participants CASCADE;
CREATE TABLE public.ic_shift_participants (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_shift_participants ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_shift_template_checklists CASCADE;
CREATE TABLE public.ic_shift_template_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_template_id uuid NOT NULL,
    checklist_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_shift_template_checklists ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_shift_template_default_checklists CASCADE;
CREATE TABLE public.ic_shift_template_default_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shift_template_id uuid NOT NULL,
    checklist_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_shift_template_default_checklists ENABLE ROW LEVEL SECURITY;
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
    ndis_worker_screening_check boolean DEFAULT false,
    ndis_worker_screening_check_expiry date,
    ndis_orientation_module boolean DEFAULT false,
    ndis_orientation_module_expiry date,
    ndis_code_of_conduct boolean DEFAULT false,
    ndis_code_of_conduct_expiry date,
    ndis_infection_control_training boolean DEFAULT false,
    ndis_infection_control_training_expiry date,
    drivers_license boolean DEFAULT false,
    drivers_license_expiry date,
    comprehensive_car_insurance boolean DEFAULT false,
    comprehensive_car_insurance_expiry date,
    separation_date date,
    auth_user_id uuid,
    photo_url text,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    UNIQUE (email),
    UNIQUE (auth_user_id)
);
ALTER TABLE public.ic_staff ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_staff_compliance CASCADE;
CREATE TABLE public.ic_staff_compliance (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    compliance_name text NOT NULL,
    completion_date date,
    expiry_date date,
    status text DEFAULT 'Complete'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_staff_compliance ENABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.ic_staff_documents CASCADE;
CREATE TABLE public.ic_staff_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_by text,
    is_restricted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_staff_documents ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id)
);
ALTER TABLE public.ic_staff_shifts ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_staff_training ENABLE ROW LEVEL SECURITY;
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
    PRIMARY KEY (id),
    UNIQUE (shift_id, staff_id)
);
ALTER TABLE public.ic_timesheets ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.ic_user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Foreign Keys
ALTER TABLE public.ic_branch_policies ADD CONSTRAINT branch_policies_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.ic_branches(id);
ALTER TABLE public.ic_checklist_item_master ADD CONSTRAINT checklist_item_master_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_checklist_item_master ADD CONSTRAINT checklist_item_master_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.ic_checklist_master(id);
ALTER TABLE public.ic_checklist_schedules ADD CONSTRAINT checklist_schedules_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_checklist_schedules ADD CONSTRAINT checklist_schedules_house_checklist_id_fkey FOREIGN KEY (house_checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_calendar_event_attachments ADD CONSTRAINT house_calendar_event_attachments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_calendar_event_participants ADD CONSTRAINT house_calendar_event_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_house_calendar_event_participants ADD CONSTRAINT house_calendar_event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_calendar_event_staff ADD CONSTRAINT house_calendar_event_staff_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_calendar_event_staff ADD CONSTRAINT house_calendar_event_staff_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_event_type_id_fkey FOREIGN KEY (event_type_id) REFERENCES public.ic_house_calendar_event_types_master(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_checklist_schedule_id_fkey FOREIGN KEY (checklist_schedule_id) REFERENCES public.ic_checklist_schedules(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_calendar_events ADD CONSTRAINT house_calendar_events_house_checklist_id_fkey FOREIGN KEY (house_checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_checklist_item_attachments ADD CONSTRAINT house_checklist_item_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.ic_house_checklist_submissions(id);
ALTER TABLE public.ic_house_checklist_item_attachments ADD CONSTRAINT house_checklist_item_attachments_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.ic_house_checklist_items(id);
ALTER TABLE public.ic_house_checklist_item_attachments ADD CONSTRAINT house_checklist_item_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_checklist_items ADD CONSTRAINT house_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_checklist_items ADD CONSTRAINT house_checklist_items_master_item_id_fkey FOREIGN KEY (master_item_id) REFERENCES public.ic_checklist_item_master(id);
ALTER TABLE public.ic_house_checklist_items ADD CONSTRAINT house_checklist_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.ic_house_checklist_items(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.ic_house_checklist_submissions(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_checklist_submission_items ADD CONSTRAINT house_checklist_submission_items_master_item_id_fkey FOREIGN KEY (master_item_id) REFERENCES public.ic_checklist_item_master(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_calendar_event_id_fkey FOREIGN KEY (calendar_event_id) REFERENCES public.ic_house_calendar_events(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_shift_assignment_id_fkey FOREIGN KEY (shift_assignment_id) REFERENCES public.ic_shift_assigned_checklists(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.ic_checklist_master(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_house_checklist_submissions ADD CONSTRAINT house_checklist_submissions_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_house_checklists ADD CONSTRAINT house_checklists_master_id_fkey FOREIGN KEY (master_id) REFERENCES public.ic_checklist_master(id);
ALTER TABLE public.ic_house_checklists ADD CONSTRAINT house_checklists_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_comms ADD CONSTRAINT house_comms_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_comms ADD CONSTRAINT house_comms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_files ADD CONSTRAINT house_files_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.ic_house_forms(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_assignments ADD CONSTRAINT house_form_assignments_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.ic_house_forms(id);
ALTER TABLE public.ic_house_form_submissions ADD CONSTRAINT house_form_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.ic_house_form_assignments(id);
ALTER TABLE public.ic_house_forms ADD CONSTRAINT house_forms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_forms ADD CONSTRAINT house_forms_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_resources ADD CONSTRAINT house_resources_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_resources ADD CONSTRAINT house_resources_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_house_shift_templates ADD CONSTRAINT house_shift_templates_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_staff_assignments ADD CONSTRAINT house_staff_assignments_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_house_staff_assignments ADD CONSTRAINT house_staff_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_houses ADD CONSTRAINT houses_house_type_id_fkey FOREIGN KEY (house_type_id) REFERENCES public.ic_house_types_master(id);
ALTER TABLE public.ic_houses ADD CONSTRAINT houses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.ic_branches(id);
ALTER TABLE public.ic_leave_requests ADD CONSTRAINT leave_requests_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_leave_requests ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.ic_leave_types(id);
ALTER TABLE public.ic_participant_contacts ADD CONSTRAINT participant_contacts_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_contacts ADD CONSTRAINT participant_contacts_contact_type_id_fkey FOREIGN KEY (contact_type_id) REFERENCES public.ic_contact_types_master(id);
ALTER TABLE public.ic_participant_documents ADD CONSTRAINT participant_documents_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_documents ADD CONSTRAINT participant_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participant_forms ADD CONSTRAINT participant_forms_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_forms ADD CONSTRAINT participant_forms_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participant_funding ADD CONSTRAINT participant_funding_funding_type_id_fkey FOREIGN KEY (funding_type_id) REFERENCES public.ic_funding_types_master(id);
ALTER TABLE public.ic_participant_funding ADD CONSTRAINT participant_funding_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_funding ADD CONSTRAINT participant_funding_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_participant_funding ADD CONSTRAINT participant_funding_funding_source_id_fkey FOREIGN KEY (funding_source_id) REFERENCES public.ic_funding_sources_master(id);
ALTER TABLE public.ic_participant_goal_progress ADD CONSTRAINT participant_goal_progress_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.ic_participant_goals(id);
ALTER TABLE public.ic_participant_goals ADD CONSTRAINT participant_goals_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_hygiene_routines ADD CONSTRAINT participant_hygiene_routines_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_medications ADD CONSTRAINT participant_medications_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.ic_medications_master(id);
ALTER TABLE public.ic_participant_medications ADD CONSTRAINT participant_medications_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_notes ADD CONSTRAINT participant_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participant_notes ADD CONSTRAINT participant_notes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_restrictive_practices ADD CONSTRAINT participant_restrictive_practices_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_participant_restrictive_practices ADD CONSTRAINT participant_restrictive_practices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_participants ADD CONSTRAINT participants_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_positions ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.ic_departments(id);
ALTER TABLE public.ic_provider_participants ADD CONSTRAINT provider_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_service_participants ADD CONSTRAINT service_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_service_participants ADD CONSTRAINT service_participants_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.ic_services(id);
ALTER TABLE public.ic_service_staff ADD CONSTRAINT service_staff_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.ic_services(id);
ALTER TABLE public.ic_service_staff ADD CONSTRAINT service_staff_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_shift_assigned_checklists ADD CONSTRAINT shift_assigned_checklists_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_shift_notes ADD CONSTRAINT shift_notes_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_shift_participants ADD CONSTRAINT shift_participants_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_shift_participants ADD CONSTRAINT shift_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.ic_participants(id);
ALTER TABLE public.ic_shift_template_checklists ADD CONSTRAINT shift_template_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_shift_template_default_checklists ADD CONSTRAINT shift_template_default_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.ic_house_checklists(id);
ALTER TABLE public.ic_shift_template_default_checklists ADD CONSTRAINT shift_template_default_checklists_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.ic_roles(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_employment_type_id_fkey FOREIGN KEY (employment_type_id) REFERENCES public.ic_employment_types_master(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff ADD CONSTRAINT staff_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.ic_departments(id);
ALTER TABLE public.ic_staff_compliance ADD CONSTRAINT staff_compliance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_documents ADD CONSTRAINT staff_documents_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_shift_template_id_fkey FOREIGN KEY (shift_template_id) REFERENCES public.ic_house_shift_templates(id);
ALTER TABLE public.ic_staff_shifts ADD CONSTRAINT staff_shifts_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.ic_houses(id);
ALTER TABLE public.ic_staff_training ADD CONSTRAINT staff_training_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_staff_training ADD CONSTRAINT staff_training_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.ic_staff_shifts(id);
ALTER TABLE public.ic_timesheets ADD CONSTRAINT timesheets_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);
ALTER TABLE public.ic_user_roles ADD CONSTRAINT user_roles_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id);

-- 4. Postgres Functions
CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func() RETURNS trigger AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    target_data JSONB;
    changes JSONB := '{}'::JSONB;
    key TEXT;
    field_label TEXT;
    old_val_text TEXT;
    new_val_text TEXT;
    changed_fields_detailed TEXT[] := ARRAY[]::TEXT[];
    entity_name_val TEXT;
    user_name_val TEXT;
    parent_name_val TEXT;
    parent_type_val TEXT;
    acting_user_id UUID;
    norm_entity_type TEXT;
    final_description TEXT;
    target_entity_id TEXT;
BEGIN
    -- Capture the acting user from Supabase Auth
    acting_user_id := auth.uid();

    -- Resolve user name
    IF acting_user_id IS NOT NULL THEN
        SELECT staff_name INTO user_name_val FROM ic_staff WHERE auth_user_id = acting_user_id LIMIT 1;
        IF user_name_val IS NULL THEN
            user_name_val := COALESCE(
                auth.jwt() -> 'user_metadata' ->> 'full_name',
                auth.jwt() -> 'user_metadata' ->> 'name',
                auth.jwt() ->> 'email'
            );
        END IF;
    END IF;

    -- Human-friendly entity names
    norm_entity_type := CASE 
        WHEN TG_TABLE_NAME = 'ic_staff' THEN 'Staff'
        WHEN TG_TABLE_NAME = 'ic_participants' THEN 'Participant'
        WHEN TG_TABLE_NAME = 'ic_houses' THEN 'House'
        WHEN TG_TABLE_NAME = 'ic_participant_contacts' THEN 'Contact'
        WHEN TG_TABLE_NAME = 'ic_participant_medications' THEN 'Medication'
        WHEN TG_TABLE_NAME = 'ic_participant_goals' THEN 'Goal'
        WHEN TG_TABLE_NAME = 'ic_staff_compliance' THEN 'Compliance'
        WHEN TG_TABLE_NAME = 'ic_staff_documents' THEN 'Document'
        WHEN TG_TABLE_NAME = 'ic_staff_training' THEN 'Training'
        WHEN TG_TABLE_NAME = 'ic_timesheets' THEN 'Timesheet'
        WHEN TG_TABLE_NAME = 'ic_leave_requests' THEN 'Leave Request'
        WHEN TG_TABLE_NAME = 'ic_shift_notes' THEN 'Shift Note'
        ELSE INITCAP(REPLACE(REPLACE(TG_TABLE_NAME, 'ic_', ''), '_', ' '))
    END;

    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    -- Resolve entity name
    entity_name_val := COALESCE(
        target_data->>'staff_name', 
        target_data->>'participant_name', 
        target_data->>'house_name',
        target_data->>'name', 
        target_data->>'title',
        target_data->>'goal_type',
        target_data->>'document_name',
        target_data->>'training_name',
        target_data->>'file_name'
    );

    -- 🔍 SMART AGGREGATE ROOT RESOLUTION
    -- Default to own ID
    target_entity_id := (target_data->>'id');

    -- Priority 1: Direct Participant relations
    IF (target_data->>'participant_id' IS NOT NULL) THEN
        SELECT participant_name INTO parent_name_val FROM ic_participants WHERE id = (target_data->>'participant_id')::uuid LIMIT 1;
        parent_type_val := 'Participant';
        target_entity_id := (target_data->>'participant_id');
        
    -- Priority 2: Direct Staff relations
    ELSIF (target_data->>'staff_id' IS NOT NULL) THEN
        SELECT staff_name INTO parent_name_val FROM ic_staff WHERE id = (target_data->>'staff_id')::uuid LIMIT 1;
        parent_type_val := 'Staff';
        target_entity_id := (target_data->>'staff_id');
        
    -- Priority 3: Direct House relations
    ELSIF (target_data->>'house_id' IS NOT NULL) THEN
        SELECT house_name INTO parent_name_val FROM ic_houses WHERE id = (target_data->>'house_id')::uuid LIMIT 1;
        parent_type_val := 'House';
        target_entity_id := (target_data->>'house_id');
    END IF;

    -- INSERT Logic
    IF (TG_OP = 'INSERT') THEN
        final_description := 'Added ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' to ' || parent_type_val || ': ' || parent_name_val;
        END IF;

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'create', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val,
            final_description, user_name_val, jsonb_build_object('new_data', target_data)
        );
        RETURN NEW;

    -- DELETE Logic
    ELSIF (TG_OP = 'DELETE') THEN
        final_description := 'Removed ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' from ' || parent_type_val || ': ' || parent_name_val;
        END IF;

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'delete', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val,
            final_description, user_name_val, jsonb_build_object('old_data', target_data)
        );
        RETURN OLD;

    -- UPDATE Logic
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        IF (old_data = new_data) THEN RETURN NEW; END IF;

        FOR key IN SELECT jsonb_object_keys(new_data) LOOP
            IF key IN ('updated_at', 'created_at', 'photo_file', 'last_sign_in_at', 'search_vector') THEN CONTINUE; END IF;

            IF (old_data->key IS DISTINCT FROM new_data->key) THEN
                field_label := CASE key
                    WHEN 'staff_name' THEN 'Name'
                    WHEN 'participant_name' THEN 'Name'
                    WHEN 'house_name' THEN 'Name'
                    WHEN 'status' THEN 'Status'
                    WHEN 'email' THEN 'Email'
                    WHEN 'phone' THEN 'Phone'
                    WHEN 'role_id' THEN 'Role'
                    WHEN 'house_id' THEN 'House'
                    WHEN 'ndis_number' THEN 'NDIS Number'
                    WHEN 'date_of_birth' THEN 'Date of Birth'
                    WHEN 'participant_id' THEN 'Participant Assignment'
                    WHEN 'staff_id' THEN 'Staff Assignment'
                    ELSE INITCAP(REPLACE(key, '_', ' '))
                END;

                old_val_text := COALESCE(NULLIF(old_data->>key, ''), '(empty)');
                new_val_text := COALESCE(NULLIF(new_data->>key, ''), '(empty)');
                changed_fields_detailed := array_append(changed_fields_detailed, field_label || ': ' || old_val_text || ' → ' || new_val_text);
                changes := changes || jsonb_build_object(key, jsonb_build_object('old', old_data->key, 'new', new_data->key));
            END IF;
        END LOOP;

        IF (changes = '{}'::JSONB) THEN RETURN NEW; END IF;

        final_description := 'Updated ' || norm_entity_type || COALESCE(' "' || entity_name_val || '"', '');
        IF parent_name_val IS NOT NULL THEN
            final_description := final_description || ' for ' || parent_type_val || ': ' || parent_name_val;
        END IF;
        final_description := final_description || ' [' || array_to_string(changed_fields_detailed, ', ') || ']';

        INSERT INTO ic_activity_log (
            activity_type, entity_type, entity_id, entity_name, description, user_name, metadata
        ) VALUES (
            'update', REPLACE(TG_TABLE_NAME, 'ic_', ''), target_entity_id, entity_name_val,
            final_description, user_name_val, jsonb_build_object('changes', changes)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in ic_audit_trigger_func for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.ic_dispatch_jwt_sync_webhook() RETURNS trigger AS $$
DECLARE
  v_record jsonb;
  v_old_record jsonb;
BEGIN
  -- Safely handle NEW/OLD records based on the operation type
  IF (TG_OP = 'DELETE') THEN
    v_record := null;
    v_old_record := row_to_json(OLD)::jsonb;
  ELSIF (TG_OP = 'INSERT') THEN
    v_record := row_to_json(NEW)::jsonb;
    v_old_record := null;
  ELSE
    v_record := row_to_json(NEW)::jsonb;
    v_old_record := row_to_json(OLD)::jsonb;
  END IF;

  -- Dispatch the asynchronous HTTP POST request
  PERFORM net.http_post(
    url := 'https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eHB1Zm15Z3diZnp6cGlvcnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mjk0MjAsImV4cCI6MjA4MDQwNTQyMH0.1C6ajWzg7cZRbVSr2474SD2iABcnHAg5B6RXIWqBYCk' -- 👈 REPLACE WITH VITE_SUPABASE_ANON_KEY
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'record', v_record,
      'old_record', v_old_record
    )
  );
  
  -- Return the appropriate record for the trigger context
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text) RETURNS text AS $$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
  -- This JOIN is now safe because of SECURITY DEFINER bypassing RLS on ic_staff and ic_role_permissions
  SELECT 
    CASE p_module
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      WHEN 'participants' THEN participants::text
      WHEN 'shift_notes' THEN shift_notes::text
      WHEN 'employees' THEN employees::text
      WHEN 'timesheets' THEN timesheets::text
      WHEN 'leave_requests' THEN leave_requests::text
      WHEN 'roster_board' THEN roster_board::text
      WHEN 'houses' THEN houses::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'access_control' THEN access_control::text
      WHEN 'master_lists' THEN master_lists::text
      WHEN 'activity_log' THEN activity_log::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions rp
  JOIN public.ic_staff s ON s.role_id = rp.role_id
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
  -- 1. Check JWT metadata
  IF (auth.jwt() -> 'app_metadata' -> 'assigned_houses') @> jsonb_build_array(p_house_id::text) THEN
    RETURN true;
  END IF;

  -- 2. Fallback to database lookup
  IF EXISTS (
    SELECT 1 FROM public.ic_house_staff_assignments hsa
    WHERE hsa.house_id = p_house_id 
    AND hsa.staff_id = public.ic_jwt_get_staff_id()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
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
CREATE OR REPLACE FUNCTION public.ic_update_compliance_status() RETURNS trigger AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'Expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status := 'Expiring Soon';
    ELSE
      NEW.status := 'Complete';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
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

-- 6. Triggers
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branch_policies;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branch_policies;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branch_policies;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_branch_policies FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branches;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branches;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_branches;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_branches;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_branches;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_branches FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_item_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_item_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_item_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_item_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_item_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_checklist_item_master_updated_at ON public.ic_checklist_item_master;
CREATE TRIGGER ic_update_checklist_item_master_updated_at BEFORE UPDATE ON public.ic_checklist_item_master FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_checklist_master_updated_at ON public.ic_checklist_master;
CREATE TRIGGER ic_update_checklist_master_updated_at BEFORE UPDATE ON public.ic_checklist_master FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_schedules;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_schedules;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_checklist_schedules;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_schedules;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_checklist_schedules;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_checklist_schedules_updated_at ON public.ic_checklist_schedules;
CREATE TRIGGER ic_update_checklist_schedules_updated_at BEFORE UPDATE ON public.ic_checklist_schedules FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_contact_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_contact_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_contact_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_contact_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_contact_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_contact_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_departments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_departments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_departments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_departments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_departments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_departments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_employment_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_employment_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_employment_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_employment_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_employment_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_employment_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_error_logs;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_error_logs FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_error_logs;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_error_logs FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_error_logs;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_error_logs FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_funding_sources_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_funding_sources_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_funding_sources_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_funding_sources_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_funding_sources_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_funding_sources_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_funding_sources_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_funding_sources_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_funding_sources_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_funding_sources_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_funding_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_funding_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_funding_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_funding_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_funding_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_funding_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_funding_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_funding_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_funding_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_funding_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_event_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
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
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_event_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_event_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_event_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
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
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_event_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_event_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_events;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_events;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_calendar_events;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_events;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_calendar_events;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_calendar_events_updated_at ON public.ic_house_calendar_events;
CREATE TRIGGER ic_update_house_calendar_events_updated_at BEFORE UPDATE ON public.ic_house_calendar_events FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_checklist_item_attachments_updated_at ON public.ic_house_checklist_item_attachments;
CREATE TRIGGER ic_update_house_checklist_item_attachments_updated_at BEFORE UPDATE ON public.ic_house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_checklist_items_updated_at ON public.ic_house_checklist_items;
CREATE TRIGGER ic_update_house_checklist_items_updated_at BEFORE UPDATE ON public.ic_house_checklist_items FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_checklist_submission_items_updated_at ON public.ic_house_checklist_submission_items;
CREATE TRIGGER ic_update_house_checklist_submission_items_updated_at BEFORE UPDATE ON public.ic_house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_checklist_submissions_updated_at ON public.ic_house_checklist_submissions;
CREATE TRIGGER ic_update_house_checklist_submissions_updated_at BEFORE UPDATE ON public.ic_house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_checklists_updated_at ON public.ic_house_checklists;
CREATE TRIGGER ic_update_house_checklists_updated_at BEFORE UPDATE ON public.ic_house_checklists FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_comms;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_comms;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_comms;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_comms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_comms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_comms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_files;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_files;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_files;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_files;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_files;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_files_updated_at ON public.ic_house_files;
CREATE TRIGGER ic_update_house_files_updated_at BEFORE UPDATE ON public.ic_house_files FOR EACH ROW EXECUTE FUNCTION ic_update_house_files_updated_at();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_assignments;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_assignments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_assignments;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_form_assignments_updated_at ON public.ic_house_form_assignments;
CREATE TRIGGER ic_update_house_form_assignments_updated_at BEFORE UPDATE ON public.ic_house_form_assignments FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_form_submissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_form_submissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_form_submissions_updated_at ON public.ic_house_form_submissions;
CREATE TRIGGER ic_update_house_form_submissions_updated_at BEFORE UPDATE ON public.ic_house_form_submissions FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_forms_updated_at ON public.ic_house_forms;
CREATE TRIGGER ic_update_house_forms_updated_at BEFORE UPDATE ON public.ic_house_forms FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_resources;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_resources;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_resources;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_resources;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_resources;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_house_resources_updated_at ON public.ic_house_resources;
CREATE TRIGGER ic_update_house_resources_updated_at BEFORE UPDATE ON public.ic_house_resources FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_shift_templates;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_shift_templates;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_shift_templates;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_shift_templates;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_shift_templates;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_shift_templates FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
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
DROP TRIGGER IF EXISTS ic_update_house_staff_assignments_updated_at ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_update_house_staff_assignments_updated_at BEFORE UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments AFTER INSERT ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments AFTER UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments AFTER DELETE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION ic_dispatch_jwt_sync_webhook();
DROP TRIGGER IF EXISTS sync_jwt_on_assignment_change ON public.ic_house_staff_assignments;
CREATE TRIGGER sync_jwt_on_assignment_change AFTER UPDATE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eHB1Zm15Z3diZnp6cGlvcnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgyOTQyMCwiZXhwIjoyMDgwNDA1NDIwfQ.J-sjWCSdlDKyTRHyMy-8bXp9NSa9bnP9xyPYveh2IFI"}', '{}', '5000');
DROP TRIGGER IF EXISTS sync_jwt_on_assignment_change ON public.ic_house_staff_assignments;
CREATE TRIGGER sync_jwt_on_assignment_change AFTER DELETE ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eHB1Zm15Z3diZnp6cGlvcnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgyOTQyMCwiZXhwIjoyMDgwNDA1NDIwfQ.J-sjWCSdlDKyTRHyMy-8bXp9NSa9bnP9xyPYveh2IFI"}', '{}', '5000');
DROP TRIGGER IF EXISTS sync_jwt_on_assignment_change ON public.ic_house_staff_assignments;
CREATE TRIGGER sync_jwt_on_assignment_change AFTER INSERT ON public.ic_house_staff_assignments FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eHB1Zm15Z3diZnp6cGlvcnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgyOTQyMCwiZXhwIjoyMDgwNDA1NDIwfQ.J-sjWCSdlDKyTRHyMy-8bXp9NSa9bnP9xyPYveh2IFI"}', '{}', '5000');
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_house_types_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_house_types_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_house_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_houses;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_houses;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_houses;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_houses;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_houses;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_houses FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_requests;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_requests;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_requests;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_requests;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_requests;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_leave_requests FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_types;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_types;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_leave_types;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_types;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_leave_types;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_leave_types FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_medications_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_medications_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_medications_master;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_medications_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_medications_master;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_medications_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_notifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_notifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_notifications;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_notifications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_notifications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_notifications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_contacts;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_contacts;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_contacts;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_contacts;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_contacts;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_contacts FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_participant_documents_updated_at ON public.ic_participant_documents;
CREATE TRIGGER ic_update_participant_documents_updated_at BEFORE UPDATE ON public.ic_participant_documents FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_forms;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_forms ON public.ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns_forms BEFORE INSERT ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns_forms ON public.ic_participant_forms;
CREATE TRIGGER ic_trigger_set_audit_columns_forms BEFORE UPDATE ON public.ic_participant_forms FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_funding;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_funding FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_funding;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_funding FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_funding;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_funding FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_funding;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_funding FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_funding;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_funding FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goal_progress;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_goal_progress FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goals;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goals;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_goals;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goals;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_goals;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_goals FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_participant_hygiene_updated_at ON public.ic_participant_hygiene_routines;
CREATE TRIGGER ic_update_participant_hygiene_updated_at BEFORE UPDATE ON public.ic_participant_hygiene_routines FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_medications;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_medications;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_medications;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_medications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_medications;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_medications FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participant_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participant_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_update_participant_notes_updated_at ON public.ic_participant_notes;
CREATE TRIGGER ic_update_participant_notes_updated_at BEFORE UPDATE ON public.ic_participant_notes FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
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
DROP TRIGGER IF EXISTS ic_update_participant_restrictive_practices_updated_at ON public.ic_participant_restrictive_practices;
CREATE TRIGGER ic_update_participant_restrictive_practices_updated_at BEFORE UPDATE ON public.ic_participant_restrictive_practices FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_permission_mappings;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_permission_mappings;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_permission_mappings;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_permission_mappings;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_permission_mappings;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_permission_mappings FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_positions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_positions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_positions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_positions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_positions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_positions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_provider_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_provider_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_provider_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_provider_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_provider_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_provider_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_providers;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_providers;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_providers;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_providers;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_providers;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_providers FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_role_permissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_role_permissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_role_permissions;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_propagate_role_permission_changes ON public.ic_role_permissions;
CREATE TRIGGER ic_propagate_role_permission_changes AFTER UPDATE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_propagate_role_sync_webhook();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_role_permissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_role_permissions;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_role_permissions FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
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
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_service_staff;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_service_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_service_staff;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_service_staff FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_services;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_services;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_services;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_services;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_services;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_services FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_assigned_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_assigned_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_notes;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_notes;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_notes FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_participants;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_participants;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_participants FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_shift_template_checklists;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_shift_template_checklists FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_shift_template_default_checklists;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_shift_template_default_checklists FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
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
CREATE TRIGGER sync_jwt_on_staff_change AFTER UPDATE ON public.ic_staff FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://jxxpufmygwbfzzpioryu.supabase.co/functions/v1/ic-update-user-roles', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4eHB1Zm15Z3diZnp6cGlvcnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgyOTQyMCwiZXhwIjoyMDgwNDA1NDIwfQ.J-sjWCSdlDKyTRHyMy-8bXp9NSa9bnP9xyPYveh2IFI"}', '{}', '5000');
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_compliance;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_compliance;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_compliance;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_compliance;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_compliance;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_update_compliance_status ON public.ic_staff_compliance;
CREATE TRIGGER ic_trigger_update_compliance_status BEFORE INSERT ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_update_compliance_status();
DROP TRIGGER IF EXISTS ic_trigger_update_compliance_status ON public.ic_staff_compliance;
CREATE TRIGGER ic_trigger_update_compliance_status BEFORE UPDATE ON public.ic_staff_compliance FOR EACH ROW EXECUTE FUNCTION ic_update_compliance_status();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_documents;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_staff_documents;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_staff_documents FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_shifts;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_shifts;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_staff_shifts;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_staff_shifts FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
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
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_timesheets;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_timesheets;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_timesheets;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_timesheets;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_timesheets FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_user_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_user_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER DELETE ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_audit_universal_trigger ON public.ic_user_roles;
CREATE TRIGGER ic_audit_universal_trigger AFTER UPDATE ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_user_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
DROP TRIGGER IF EXISTS ic_trigger_set_audit_columns ON public.ic_user_roles;
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE UPDATE ON public.ic_user_roles FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();

COMMIT;
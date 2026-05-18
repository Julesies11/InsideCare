-- FILE: 2026032000_baseline_schema.sql

-- ========================================================================================
-- BASELINE SCHEMA 2026-03-20
-- Synthesized from 53 migration files.
-- Logically ordered: Extensions/Types -> Master Tables -> Core Entities -> Dependent Tables -> RLS -> Storage
-- ========================================================================================

-- ============================================================
-- 1. EXTENSIONS & TYPES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE public.status_enum AS ENUM ('draft', 'active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. MASTER TABLES (No Foreign Keys)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  permissions text[] NULL DEFAULT '{}'::text[],
  assigned_count integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles USING btree (name);

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT branches_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.employment_types_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employment_types_master_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.contact_types_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_types_master_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.funding_sources_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funding_sources_master_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.funding_types_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funding_types_master_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.medications_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  side_effects text NULL,
  interactions text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medications_master_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leave_types_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.house_types_master (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.house_calendar_event_types_master (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.checklist_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  frequency text NOT NULL,
  description text NULL,
  days_of_week text[] DEFAULT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT checklist_master_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_checklist_master_name ON public.checklist_master USING btree (name);

CREATE TABLE IF NOT EXISTS public.checklist_item_master (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  master_id uuid NOT NULL,
  title text NOT NULL,
  instructions text NULL,
  priority text NULL DEFAULT 'medium'::text,
  is_required boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT checklist_item_master_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_item_master_master_id_fkey FOREIGN KEY (master_id) REFERENCES checklist_master (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_checklist_item_master_id ON public.checklist_item_master USING btree (master_id);

-- ============================================================
-- 3. CORE ENTITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  auth_user_id uuid NULL UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  name text NULL,
  email text NULL UNIQUE,
  phone text NULL,
  hire_date date NULL,
  date_of_birth text NULL,
  address text NULL,
  emergency_contact_name text NULL,
  emergency_contact_phone text NULL,
  notes text NULL,
  branch_id uuid NULL REFERENCES branches (id) ON DELETE SET NULL,
  role_id uuid NULL REFERENCES roles (id) ON DELETE SET NULL,
  status public.status_enum NOT NULL DEFAULT 'draft'::status_enum,
  hobbies text NULL,
  allergies text NULL,
  availability text NULL,
  department_id uuid NULL REFERENCES departments (id) ON DELETE SET NULL,
  employment_type_id uuid NULL REFERENCES employment_types_master (id) ON DELETE SET NULL,
  manager_id uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  ndis_worker_screening_check boolean NULL DEFAULT false,
  ndis_worker_screening_check_expiry date NULL,
  ndis_orientation_module boolean NULL DEFAULT false,
  ndis_orientation_module_expiry date NULL,
  ndis_code_of_conduct boolean NULL DEFAULT false,
  ndis_code_of_conduct_expiry date NULL,
  ndis_infection_control_training boolean NULL DEFAULT false,
  ndis_infection_control_training_expiry date NULL,
  drivers_license boolean NULL DEFAULT false,
  drivers_license_expiry date NULL,
  comprehensive_car_insurance boolean NULL DEFAULT false,
  comprehensive_car_insurance_expiry date NULL,
  separation_date date NULL,
  photo_url text NULL,
  contracted_hours numeric(5, 2) DEFAULT 0.00,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_name_required_when_active CHECK (
    (status <> 'active'::status_enum) OR (name IS NOT NULL AND length(TRIM(name)) > 0)
  ),
  CONSTRAINT staff_email_required_when_active CHECK (
    (status <> 'active'::status_enum) OR (email IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff (email);
CREATE INDEX IF NOT EXISTS idx_staff_name ON public.staff (name);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON public.staff (branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_id ON public.staff (role_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff (status);
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON public.staff (department_id);
CREATE INDEX IF NOT EXISTS idx_staff_employment_type_id ON public.staff (employment_type_id);
CREATE INDEX IF NOT EXISTS idx_staff_manager_id ON public.staff (manager_id);
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON public.staff (auth_user_id);

CREATE TABLE IF NOT EXISTS public.houses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  branch_id uuid NULL REFERENCES branches (id) ON DELETE CASCADE,
  house_type_id uuid NULL REFERENCES house_types_master (id) ON DELETE SET NULL,
  address text NULL,
  phone text NULL,
  capacity integer NULL DEFAULT 0,
  current_occupancy integer NULL DEFAULT 0,
  house_manager text NULL,
  status text NULL DEFAULT 'active'::text CHECK (status IN ('active', 'inactive', 'maintenance')),
  notes text NULL,
  individuals_breakdown text NULL,
  participant_dynamics text NULL,
  observations text NULL,
  general_house_details text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT houses_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_houses_branch_id ON public.houses (branch_id);
CREATE INDEX IF NOT EXISTS idx_houses_name ON public.houses (name);
CREATE INDEX IF NOT EXISTS idx_houses_status ON public.houses (status);

CREATE TABLE IF NOT EXISTS public.participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NULL,
  email text NULL,
  address text NULL,
  date_of_birth date NULL,
  ndis_number text NULL,
  support_coordinator text NULL,
  allergies text NULL,
  support_level text NULL,
  routine text NULL,
  hygiene_support text NULL,
  current_goals text NULL,
  current_medications text NULL,
  general_notes text NULL,
  restrictive_practices text NULL,
  service_providers text NULL,
  house_id uuid NULL REFERENCES houses (id) ON DELETE SET NULL,
  photo_url text NULL,
  status public.status_enum NOT NULL DEFAULT 'draft'::status_enum,
  house_phone text NULL,
  personal_mobile text NULL,
  primary_diagnosis text NULL,
  secondary_diagnosis text NULL,
  behaviour_of_concern text NULL,
  pbsp_engaged boolean NULL,
  bsp_available boolean NULL,
  specialist_name text NULL,
  specialist_phone text NULL,
  specialist_email text NULL,
  restrictive_practice_authorisation boolean NULL,
  restrictive_practice_details text NULL,
  restrictive_practices_yn boolean NULL,
  mtmp_required boolean NULL,
  mtmp_details text NULL,
  mobility_support text NULL,
  meal_prep_support text NULL,
  household_support text NULL,
  communication_type varchar(20) NULL,
  communication_notes text NULL,
  communication_language_needs text NULL,
  finance_support text NULL,
  health_wellbeing_support text NULL,
  cultural_religious_support text NULL,
  other_support text NULL,
  mental_health_plan text NULL,
  medical_plan text NULL,
  natural_disaster_plan text NULL,
  pharmacy_name text NULL,
  pharmacy_contact text NULL,
  pharmacy_location text NULL,
  gp_name text NULL,
  gp_contact text NULL,
  gp_location text NULL,
  psychiatrist_name text NULL,
  psychiatrist_contact text NULL,
  psychiatrist_location text NULL,
  medical_routine_other text NULL,
  medical_routine_general_process text NULL,
  move_in_date date NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participants_pkey PRIMARY KEY (id),
  CONSTRAINT participant_email_required_when_active CHECK (
    (status <> 'active'::status_enum) OR (email IS NOT NULL)
  ),
  CONSTRAINT participant_name_required_when_active CHECK (
    (status <> 'active'::status_enum) OR (name IS NOT NULL AND length(TRIM(name)) > 0)
  ),
  CONSTRAINT participants_mtmp_details_required CHECK (
    (mtmp_required = false) OR (mtmp_details IS NOT NULL AND length(TRIM(mtmp_details)) > 0)
  )
);
CREATE INDEX IF NOT EXISTS idx_participants_house_id ON public.participants (house_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants (status);

-- ============================================================
-- 4. HOUSE & PARTICIPANT CHILD ENTITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.house_staff_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NOT NULL REFERENCES houses (id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  is_primary boolean NULL DEFAULT false,
  start_date date NULL,
  end_date date NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_staff_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT house_staff_assignments_house_id_staff_id_key UNIQUE (house_id, staff_id)
);
CREATE INDEX IF NOT EXISTS idx_house_staff_house_id ON public.house_staff_assignments (house_id);
CREATE INDEX IF NOT EXISTS idx_house_staff_staff_id ON public.house_staff_assignments (staff_id);
CREATE INDEX IF NOT EXISTS idx_house_staff_is_primary ON public.house_staff_assignments (is_primary);

CREATE TABLE IF NOT EXISTS public.participant_medications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  medication_id uuid NULL REFERENCES medications_master (id) ON DELETE RESTRICT,
  dosage text NULL,
  frequency text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_medications_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_medications_participant ON public.participant_medications (participant_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.participant_medications (is_active);
CREATE INDEX IF NOT EXISTS idx_participant_medications_medication_id ON public.participant_medications (medication_id);

CREATE TABLE IF NOT EXISTS public.participant_notes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  note_type text NULL,
  content text NOT NULL,
  is_important boolean NULL DEFAULT false,
  is_private boolean NULL DEFAULT false,
  created_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_notes_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_notes_participant ON public.participant_notes (participant_id);

CREATE TABLE IF NOT EXISTS public.participant_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NULL,
  mime_type text NULL,
  uploaded_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  is_restricted boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_documents_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_documents_participant ON public.participant_documents (participant_id);

CREATE TABLE IF NOT EXISTS public.participant_goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  description text NOT NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_goals_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_goals_participant ON public.participant_goals (participant_id);
CREATE INDEX IF NOT EXISTS idx_goals_active ON public.participant_goals (is_active);
CREATE INDEX IF NOT EXISTS idx_goals_type ON public.participant_goals (goal_type);

CREATE TABLE IF NOT EXISTS public.participant_goal_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES participant_goals (id) ON DELETE CASCADE,
  progress_note text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_goal_progress_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON public.participant_goal_progress (goal_id);

CREATE TABLE IF NOT EXISTS public.participant_funding (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  house_id uuid NULL REFERENCES houses (id) ON DELETE SET NULL,
  funding_source_id uuid NULL REFERENCES funding_sources_master (id) ON DELETE RESTRICT,
  funding_type_id uuid NULL REFERENCES funding_types_master (id) ON DELETE RESTRICT,
  code text NULL,
  invoice_recipient text NULL,
  allocated_amount numeric(12, 2) NOT NULL,
  used_amount numeric(12, 2) NULL DEFAULT 0,
  remaining_amount numeric(12, 2) NULL,
  status text NULL DEFAULT 'Active'::text,
  end_date date NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_funding_pkey PRIMARY KEY (id),
  CONSTRAINT participant_funding_status_check CHECK (
    status IN ('Active', 'Near Depletion', 'Expired', 'Inactive')
  )
);
CREATE INDEX IF NOT EXISTS idx_participant_funding_participant_id ON public.participant_funding (participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_funding_source_id ON public.participant_funding (funding_source_id);
CREATE INDEX IF NOT EXISTS idx_participant_funding_type_id ON public.participant_funding (funding_type_id);

CREATE TABLE IF NOT EXISTS public.participant_forms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  form_type text NOT NULL,
  form_title text NOT NULL,
  form_data jsonb NULL,
  submitted_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  submission_date date NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_forms_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_forms_participant ON public.participant_forms (participant_id);

CREATE TABLE IF NOT EXISTS public.participant_hygiene_routines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  routine_type text NOT NULL,
  support_level text NOT NULL,
  frequency text NULL,
  time_of_day text NULL,
  duration_minutes integer NULL,
  specific_instructions text NULL,
  equipment_needed text NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_hygiene_routines_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_hygiene_participant ON public.participant_hygiene_routines (participant_id);

CREATE TABLE IF NOT EXISTS public.participant_restrictive_practices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  practice_type text NOT NULL,
  description text NOT NULL,
  justification text NOT NULL,
  authorization_date date NULL,
  authorized_by text NULL,
  review_date date NOT NULL,
  status text NULL DEFAULT 'Active'::text,
  conditions text NULL,
  alternatives_considered text NULL,
  monitoring_requirements text NULL,
  incident_reporting_protocol text NULL,
  is_ndis_reportable boolean NULL DEFAULT true,
  created_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_restrictive_practices_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_restrictive_participant ON public.participant_restrictive_practices (participant_id);

CREATE TABLE IF NOT EXISTS public.participant_contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  contact_type_id uuid NULL REFERENCES contact_types_master (id) ON DELETE RESTRICT,
  contact_name text NOT NULL,
  phone text NULL,
  email text NULL,
  address text NULL,
  is_active boolean NULL DEFAULT true,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT participant_contacts_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_participant ON public.participant_contacts (participant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON public.participant_contacts (is_active);
CREATE INDEX IF NOT EXISTS idx_participant_contacts_contact_type_id ON public.participant_contacts (contact_type_id);

CREATE TABLE IF NOT EXISTS public.house_resources (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NULL REFERENCES houses (id) ON DELETE CASCADE,
  created_by uuid NULL REFERENCES staff (id),
  title text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  description text NULL,
  priority text NULL DEFAULT 'Medium'::text,
  phone text NULL,
  address text NULL,
  file_url text NULL,
  file_name text NULL,
  file_size integer NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_resources_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_resources_house_id ON public.house_resources (house_id);
CREATE INDEX IF NOT EXISTS idx_house_resources_category ON public.house_resources (category);
CREATE INDEX IF NOT EXISTS idx_house_resources_type ON public.house_resources (type);
CREATE INDEX IF NOT EXISTS idx_house_resources_priority ON public.house_resources (priority);

CREATE TABLE IF NOT EXISTS public.staff_compliance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  compliance_name text NOT NULL,
  completion_date date NULL,
  expiry_date date NULL,
  status text NULL DEFAULT 'Complete'::text CHECK (status IN ('Complete', 'Expiring Soon', 'Expired', 'Incomplete', 'Not Required')),
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT staff_compliance_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_staff_compliance_staff_id ON public.staff_compliance (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_compliance_status ON public.staff_compliance (status);
CREATE INDEX IF NOT EXISTS idx_staff_compliance_expiry_date ON public.staff_compliance (expiry_date);

CREATE TABLE IF NOT EXISTS public.staff_training (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NULL REFERENCES staff (id) ON DELETE CASCADE,
  created_by uuid NULL REFERENCES staff (id),
  title text NOT NULL,
  category text NOT NULL,
  description text NULL,
  provider text NULL,
  date_completed date NULL,
  expiry_date date NULL,
  file_path text NULL,
  file_name text NULL,
  file_size integer NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT staff_training_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_staff_training_staff_id ON public.staff_training (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_expiry_date ON public.staff_training (expiry_date);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NULL,
  mime_type text NULL,
  uploaded_by text NULL,
  is_restricted boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT staff_documents_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON public.staff_documents (staff_id);

CREATE TABLE IF NOT EXISTS public.house_files (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NULL REFERENCES houses (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NULL,
  file_type text NULL,
  category text NULL,
  version text NULL,
  status text NULL DEFAULT 'current'::text,
  uploaded_by text NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_files_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_files_house_id ON public.house_files (house_id);
CREATE INDEX IF NOT EXISTS idx_house_files_status ON public.house_files (status);
CREATE INDEX IF NOT EXISTS idx_house_files_category ON public.house_files (category);

CREATE TABLE IF NOT EXISTS public.house_forms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NULL REFERENCES houses (id) ON DELETE CASCADE,
  created_by uuid NULL REFERENCES staff (id),
  name text NOT NULL,
  type text NOT NULL,
  description text NULL,
  frequency text NOT NULL,
  is_global boolean NULL DEFAULT false,
  status text NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_forms_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_forms_house_id ON public.house_forms (house_id);

CREATE TABLE IF NOT EXISTS public.house_form_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  form_id uuid NULL REFERENCES house_forms (id) ON DELETE CASCADE,
  participant_id uuid NULL REFERENCES participants (id) ON DELETE CASCADE,
  staff_id uuid NULL REFERENCES staff (id) ON DELETE CASCADE,
  assigned_by uuid NULL REFERENCES staff (id),
  completed_by uuid NULL REFERENCES staff (id),
  due_date date NULL,
  status text NULL DEFAULT 'pending'::text,
  completed_at timestamp with time zone NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_form_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_target_check CHECK (
    (participant_id IS NOT NULL AND staff_id IS NULL) OR (participant_id IS NULL AND staff_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_house_form_assignments_form_id ON public.house_form_assignments (form_id);
CREATE INDEX IF NOT EXISTS idx_house_form_assignments_participant_id ON public.house_form_assignments (participant_id);
CREATE INDEX IF NOT EXISTS idx_house_form_assignments_staff_id ON public.house_form_assignments (staff_id);
CREATE INDEX IF NOT EXISTS idx_house_form_assignments_status ON public.house_form_assignments (status);

CREATE TABLE IF NOT EXISTS public.house_form_submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  form_id uuid NULL REFERENCES house_forms (id) ON DELETE CASCADE,
  assignment_id uuid NULL REFERENCES house_form_assignments (id) ON DELETE SET NULL,
  submitted_by uuid NULL REFERENCES staff (id),
  participant_id uuid NULL REFERENCES participants (id),
  submission_data jsonb NULL,
  status text NULL DEFAULT 'complete'::text,
  submitted_at timestamp with time zone NULL DEFAULT now(),
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_form_submissions_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_form_submissions_form_id ON public.house_form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_house_form_submissions_submitted_by ON public.house_form_submissions (submitted_by);

-- ============================================================
-- 5. OPERATIONAL TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  end_date date NOT NULL DEFAULT CURRENT_DATE,
  house_id uuid NULL REFERENCES houses (id) ON DELETE SET NULL,
  shift_type character varying(50) NOT NULL DEFAULT 'SIL',
  status character varying(50) NOT NULL DEFAULT 'Scheduled',
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT staff_shifts_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON public.staff_shifts (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON public.staff_shifts (shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_house_id ON public.staff_shifts (house_id);

CREATE TABLE IF NOT EXISTS public.timesheets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  shift_id uuid NULL REFERENCES staff_shifts (id) ON DELETE SET NULL,
  clock_in timestamp with time zone NOT NULL,
  clock_out timestamp with time zone NOT NULL,
  break_minutes integer NOT NULL DEFAULT 0,
  notes text NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  admin_notes text NULL,
  actual_start timestamp with time zone NULL,
  actual_end timestamp with time zone NULL,
  overtime_hours numeric(5, 2) NOT NULL DEFAULT 0,
  overtime_explanation text NULL,
  travel_km numeric(6, 2) NOT NULL DEFAULT 0,
  incident_tag boolean NOT NULL DEFAULT false,
  sick_shift boolean NOT NULL DEFAULT false,
  shift_notes_text text NULL,
  submitted_at timestamp with time zone NULL,
  rejection_reason text NULL,
  approved_at timestamp with time zone NULL,
  approved_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  late_submission boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT timesheets_pkey PRIMARY KEY (id),
  CONSTRAINT timesheets_shift_staff_unique UNIQUE (shift_id, staff_id)
);
CREATE INDEX IF NOT EXISTS idx_timesheets_staff_id ON public.timesheets (staff_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON public.timesheets (status);
CREATE INDEX IF NOT EXISTS idx_timesheets_submitted_at ON public.timesheets (submitted_at);

CREATE TABLE IF NOT EXISTS public.shift_notes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  participant_id uuid NULL REFERENCES participants (id) ON DELETE SET NULL,
  staff_id uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  shift_id uuid NULL REFERENCES staff_shifts (id) ON DELETE SET NULL,
  house_id uuid NULL REFERENCES houses (id) ON DELETE SET NULL,
  shift_date date NOT NULL,
  shift_time text NULL,
  notes text NULL,
  full_note text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT shift_notes_pkey PRIMARY KEY (id),
  CONSTRAINT shift_notes_shift_staff_unique UNIQUE (shift_id, staff_id)
);
CREATE INDEX IF NOT EXISTS idx_shift_notes_participant ON public.shift_notes (participant_id);
CREATE INDEX IF NOT EXISTS idx_shift_notes_staff_id ON public.shift_notes (staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_notes_date ON public.shift_notes (shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_notes_house_id ON public.shift_notes (house_id);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES leave_types (id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text NULL,
  attachment_url text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leave_requests_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  link text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  message text NOT NULL,
  category varchar(50) NOT NULL,
  details jsonb NULL,
  url text NULL,
  user_agent text NULL,
  app_version varchar(50) NULL,
  resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT error_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  activity_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  entity_name text NULL,
  description text NULL,
  user_name text NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_log_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id ON public.activity_log (entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON public.activity_log (entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);

-- ============================================================
-- 6. CHECKLIST SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.house_checklists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NULL REFERENCES houses (id) ON DELETE CASCADE,
  master_id uuid NULL REFERENCES checklist_master(id) ON DELETE SET NULL,
  name text NOT NULL,
  frequency text NOT NULL,
  days_of_week text[] DEFAULT NULL,
  description text NULL,
  is_global boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklists_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_checklists_house_id ON public.house_checklists (house_id);

CREATE TABLE IF NOT EXISTS public.checklist_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NOT NULL REFERENCES houses (id) ON DELETE CASCADE,
  house_checklist_id uuid NOT NULL REFERENCES house_checklists (id) ON DELETE CASCADE,
  rrule text NOT NULL,
  start_date date NOT NULL,
  end_date date NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_schedules_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.house_calendar_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NULL REFERENCES houses (id) ON DELETE CASCADE,
  event_type_id uuid NULL REFERENCES house_calendar_event_types_master (id) ON DELETE SET NULL,
  checklist_schedule_id uuid NULL REFERENCES checklist_schedules (id) ON DELETE CASCADE,
  house_checklist_id uuid NULL REFERENCES house_checklists (id) ON DELETE SET NULL,
  is_checklist_event boolean DEFAULT false,
  title text NOT NULL,
  type text NOT NULL,
  description text NULL,
  event_date date NOT NULL,
  start_time time without time zone NULL,
  end_time time without time zone NULL,
  participant_id uuid NULL REFERENCES participants (id) ON DELETE CASCADE,
  assigned_staff_id uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  status text NULL DEFAULT 'scheduled',
  location text NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES staff (id),
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_calendar_events_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_calendar_events_house_id ON public.house_calendar_events (house_id);
CREATE INDEX IF NOT EXISTS idx_house_calendar_events_date ON public.house_calendar_events (event_date);

CREATE TABLE IF NOT EXISTS public.house_checklist_submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NOT NULL REFERENCES houses (id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES house_checklists (id) ON DELETE CASCADE,
  shift_id uuid NULL REFERENCES staff_shifts (id) ON DELETE SET NULL,
  calendar_event_id uuid NULL REFERENCES house_calendar_events (id) ON DELETE SET NULL,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  submitted_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'In Progress',
  completion_percentage integer DEFAULT 0,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT house_checklist_submissions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.house_checklist_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  checklist_id uuid NULL REFERENCES house_checklists (id) ON DELETE CASCADE,
  master_item_id uuid NULL REFERENCES checklist_item_master (id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text NULL,
  priority text NULL DEFAULT 'medium',
  is_required boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklist_items_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_house_checklist_items_checklist_id ON public.house_checklist_items (checklist_id);

CREATE TABLE IF NOT EXISTS public.house_checklist_submission_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES house_checklist_submissions (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES house_checklist_items (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending',
  completed_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  completed_at timestamp with time zone NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT house_checklist_submission_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.house_checklist_item_attachments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES house_checklist_submissions (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES house_checklist_items (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NULL,
  mime_type text NULL,
  uploaded_by uuid NULL REFERENCES staff (id) ON DELETE SET NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklist_item_attachments_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Staff
CREATE POLICY "Admins have full access to staff" ON staff FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
CREATE POLICY "Staff can read own record" ON staff FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- Timesheets
CREATE POLICY "Admins have full access to timesheets" ON timesheets FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
CREATE POLICY "Staff can read own timesheets" ON timesheets FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can create own timesheets" ON timesheets FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own timesheets" ON timesheets FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Activity Log
CREATE POLICY "Authenticated users can read activity log" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activity log" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Shift Notes
CREATE POLICY "Admins have full access to shift_notes" ON shift_notes FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
CREATE POLICY "Staff can read all shift notes" ON shift_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create shift notes" ON shift_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update own shift notes" ON shift_notes FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Error Logs
CREATE POLICY "Users can insert their own error logs" ON error_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anonymous users can insert error logs" ON error_logs FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- Checklist Schedules
CREATE POLICY "Admins full access to checklist_schedules" ON checklist_schedules FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
CREATE POLICY "Staff read assigned checklist_schedules" ON checklist_schedules FOR SELECT TO authenticated USING (house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-attachments', 'checklist-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'checklist-attachments' );
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'checklist-attachments' );


-- FILE: 2026032001_harden_rls_policies.sql

-- ========================================================================================
-- COMPREHENSIVE RLS HARDENING 2026-03-20
-- Objective: Drop all existing policies and recreate them with strict Admin/Staff boundaries.
-- ========================================================================================

-- 1. DROP ALL EXISTING POLICIES (Safety Clean Slate)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Public schema policies
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
    
    -- Storage schema policies
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname = 'storage') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. ENABLE RLS ON ALL TABLES
-- Core Entities
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Participant Child Entities (Sensitive Clinical Data)
ALTER TABLE public.participant_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_hygiene_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_restrictive_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_contacts ENABLE ROW LEVEL SECURITY;

-- Operational Entities
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Checklist System
ALTER TABLE public.checklist_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_item_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_events ENABLE ROW LEVEL SECURITY;

-- System & Master Tables
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_sources_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_types_master ENABLE ROW LEVEL SECURITY;

-- 3. GLOBAL ADMIN POLICY
-- Allows Admins full access to all tables in the public schema
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING ((auth.jwt() -> ''user_metadata'' ->> ''is_admin'')::boolean = true)', t.tablename);
    END LOOP;
END $$;

-- 4. STAFF ROLE POLICIES (Scoping access for non-admin users)

-- Staff Table: Can read own profile
CREATE POLICY "Staff can read own record" ON public.staff FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- Participant Access: SELECT only (for clinical awareness)
-- Note: Sensitive fields might be handled by frontend logic or future scoped RLS
CREATE POLICY "Staff can select all participants" ON public.participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant child entities" ON public.participant_medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant notes" ON public.participant_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant goals" ON public.participant_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant goal progress" ON public.participant_goal_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant hygiene routines" ON public.participant_hygiene_routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant contacts" ON public.participant_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select participant restrictive practices" ON public.participant_restrictive_practices FOR SELECT TO authenticated USING (true);

-- Houses & Assignments: SELECT only
CREATE POLICY "Staff can select all houses" ON public.houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can select own house assignments" ON public.house_staff_assignments FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- Shifts & Roster: SELECT only (Full transparency for continuity of care)
CREATE POLICY "Staff can select staff shifts" ON public.staff_shifts FOR SELECT TO authenticated USING (true);

-- Shift Notes: Read all, create any, update own
CREATE POLICY "Staff can select all shift notes" ON public.shift_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert shift notes" ON public.shift_notes FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own shift notes" ON public.shift_notes FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- Timesheets: Manage own only
CREATE POLICY "Staff can select own timesheets" ON public.timesheets FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can insert own timesheets" ON public.timesheets FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own pending timesheets" ON public.timesheets FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()) AND status IN ('draft', 'pending'));

-- Leave Requests: Manage own only
CREATE POLICY "Staff can select own leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can insert own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can update own pending leave requests" ON public.leave_requests FOR UPDATE TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()) AND status = 'pending');

-- Compliance & Training: Read own only
CREATE POLICY "Staff can select own compliance" ON public.staff_compliance FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can select own training" ON public.staff_training FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can select own documents" ON public.staff_documents FOR SELECT TO authenticated USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- Checklist System (Staff access scoped to assigned houses)
CREATE POLICY "Staff select checklist templates" ON public.checklist_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select checklist item templates" ON public.checklist_item_master FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage assigned house checklists" ON public.house_checklists FOR ALL TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned checklist submissions" ON public.house_checklist_submissions FOR ALL TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned submission items" ON public.house_checklist_submission_items FOR ALL TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff manage assigned checklist attachments" ON public.house_checklist_item_attachments FOR ALL TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff select assigned checklist schedules" ON public.checklist_schedules FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- System & Master Tables: Read-only for staff
CREATE POLICY "Staff select master tables" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select medications master" ON public.medications_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select leave types" ON public.leave_types FOR SELECT TO authenticated USING (true);

-- Activity Logs & Notifications
CREATE POLICY "Authenticated users insert activity log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users select activity log" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- Error Logs
CREATE POLICY "Users insert error logs" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Anon insert error logs" ON public.error_logs FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- 5. STORAGE POLICIES
-- Scoped access for storage buckets

CREATE POLICY "Admins full storage access" ON storage.objects FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Checklist Attachments: SELECT if assigned to house, INSERT if assigned
CREATE POLICY "Staff select house attachments" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'checklist-attachments' AND (EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa
    JOIN public.staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
  )));

CREATE POLICY "Staff upload house attachments" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'checklist-attachments' AND (EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa
    JOIN public.staff s ON s.id = hsa.staff_id
    WHERE s.auth_user_id = auth.uid()
  )));

-- Profile Photos: Publicly readable for authenticated users (to show in UI)
CREATE POLICY "Authenticated users read profile photos" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id IN ('participant-photos', 'staff-photos'));


-- FILE: 2026032003_fix_missing_rls_policies.sql

-- ========================================================================================
-- RLS POLICY FIX: House Checklist System & Calendar 2026-03-20
-- Objective: 
-- 1. Restore Staff access to house checklist items and master types.
-- 2. Restore Staff access to house calendar events.
-- 3. Ensure Staff can see their coworkers' assignments for coordination.
-- 4. Enable RLS and add policies for remaining House system tables.
-- ========================================================================================

-- 1. HOUSE CHECKLIST SYSTEM & CALENDAR
-- Staff need to see the items for checklists and the master event types.

ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_events ENABLE ROW LEVEL SECURITY;

-- Restore SELECT access to items
DROP POLICY IF EXISTS "Staff select assigned house checklist items" ON public.house_checklist_items;
CREATE POLICY "Staff select assigned house checklist items" ON public.house_checklist_items FOR SELECT TO authenticated 
  USING (checklist_id IN (
    SELECT id FROM public.house_checklists 
    WHERE house_id IN (
      SELECT house_id FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  ));

-- Allow SELECT access to calendar event types (needed for labels/dropdowns)
DROP POLICY IF EXISTS "Staff select house calendar event types master" ON public.house_calendar_event_types_master;
CREATE POLICY "Staff select house calendar event types master" ON public.house_calendar_event_types_master FOR SELECT TO authenticated USING (true);

-- Allow SELECT/INSERT/UPDATE for calendar events (scoped by house)
DROP POLICY IF EXISTS "Staff manage assigned house calendar events" ON public.house_calendar_events;
CREATE POLICY "Staff manage assigned house calendar events" ON public.house_calendar_events FOR ALL TO authenticated 
  USING (house_id IN (
    SELECT house_id FROM public.house_staff_assignments hsa 
    JOIN public.staff s ON s.id = hsa.staff_id 
    WHERE s.auth_user_id = auth.uid()
  ));

-- 2. ADDITIONAL HOUSE SYSTEMS (Missing from previous hardening)
ALTER TABLE public.house_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_form_submissions ENABLE ROW LEVEL SECURITY;

-- Standard scoped policies for these (Access based on house assignment)
CREATE POLICY "Staff select house resources" ON public.house_resources FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff select house files" ON public.house_files FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff select house forms" ON public.house_forms FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned house form assignments" ON public.house_form_assignments FOR ALL TO authenticated 
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff manage assigned house form submissions" ON public.house_form_submissions FOR ALL TO authenticated 
  USING (submitted_by IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

-- 3. HOUSE STAFF ASSIGNMENTS (Coworker visibility)
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select coworkers in same houses" ON public.house_staff_assignments;
CREATE POLICY "Staff select coworkers in same houses" ON public.house_staff_assignments FOR SELECT TO authenticated 
  USING (house_id IN (
    SELECT house_id FROM public.house_staff_assignments hsa 
    JOIN public.staff s ON s.id = hsa.staff_id 
    WHERE s.auth_user_id = auth.uid()
  ));

-- 4. MISSING CHILD ENTITY SELECT POLICIES
ALTER TABLE public.participant_hygiene_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_restrictive_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff select participant hygiene routines" ON public.participant_hygiene_routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant restrictive practices" ON public.participant_restrictive_practices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant forms" ON public.participant_forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant medications" ON public.participant_medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant notes" ON public.participant_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant documents" ON public.participant_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant goals" ON public.participant_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant goal progress" ON public.participant_goal_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant funding" ON public.participant_funding FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff select participant contacts" ON public.participant_contacts FOR SELECT TO authenticated USING (true);


-- FILE: 2026032004_fix_rls_recursion.sql

-- ========================================================================================
-- RLS RECURSION & PERMISSION FIX 2026-03-20
-- Objective: 
-- 1. Eliminate infinite recursion in house_staff_assignments.
-- 2. Restore Staff access to House and Checklist systems.
-- 3. Refine permissions (removing Staff DELETE access where inappropriate).
-- ========================================================================================

-- 1. FIX HOUSE_STAFF_ASSIGNMENTS (The recursion root)
-- We allow all authenticated users to read assignments. This is safe and allows
-- other RLS policies to use this table as a lookup without recursive loops.
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select coworkers in same houses" ON public.house_staff_assignments;
DROP POLICY IF EXISTS "Staff can select own house assignments" ON public.house_staff_assignments;
DROP POLICY IF EXISTS "Authenticated users select assignments" ON public.house_staff_assignments;

CREATE POLICY "Staff select assignments lookup" ON public.house_staff_assignments 
  FOR SELECT TO authenticated 
  USING (true);

-- 2. REFINE HOUSE CHECKLIST PERMISSIONS
-- Staff should see checklists and items for their houses, but not modify the templates.
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned house checklists" ON public.house_checklists;

CREATE POLICY "Staff select assigned house checklists" ON public.house_checklists 
  FOR SELECT TO authenticated 
  USING (house_id IN (
    SELECT house_id FROM public.house_staff_assignments hsa 
    JOIN public.staff s ON s.id = hsa.staff_id 
    WHERE s.auth_user_id = auth.uid()
  ));

-- 3. REFINE CHECKLIST SUBMISSION PERMISSIONS
-- Staff can manage submissions, items, and attachments for their assigned houses.
-- We use SELECT/INSERT/UPDATE instead of ALL to prevent DELETE.

-- Submissions
ALTER TABLE public.house_checklist_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned checklist submissions" ON public.house_checklist_submissions;

CREATE POLICY "Staff select assigned house submissions" ON public.house_checklist_submissions 
  FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff insert assigned house submissions" ON public.house_checklist_submissions 
  FOR INSERT TO authenticated 
  WITH CHECK (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff update assigned house submissions" ON public.house_checklist_submissions 
  FOR UPDATE TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- Submission Items
ALTER TABLE public.house_checklist_submission_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned submission items" ON public.house_checklist_submission_items;

CREATE POLICY "Staff select assigned submission items" ON public.house_checklist_submission_items 
  FOR SELECT TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff insert assigned submission items" ON public.house_checklist_submission_items 
  FOR INSERT TO authenticated 
  WITH CHECK (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

CREATE POLICY "Staff update assigned submission items" ON public.house_checklist_submission_items 
  FOR UPDATE TO authenticated 
  USING (submission_id IN (SELECT id FROM public.house_checklist_submissions WHERE house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));

-- 4. REFINE HOUSE CALENDAR PERMISSIONS
-- Staff can see and create events, but not delete them.
ALTER TABLE public.house_calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage assigned house calendar events" ON public.house_calendar_events;

CREATE POLICY "Staff select assigned house events" ON public.house_calendar_events 
  FOR SELECT TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff insert assigned house events" ON public.house_calendar_events 
  FOR INSERT TO authenticated 
  WITH CHECK (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

CREATE POLICY "Staff update assigned house events" ON public.house_calendar_events 
  FOR UPDATE TO authenticated 
  USING (house_id IN (SELECT house_id FROM public.house_staff_assignments hsa JOIN public.staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- 5. FINAL CHECKLIST ITEM FIX
-- Ensure Staff can select items for their assigned checklists.
ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff select assigned house checklist items" ON public.house_checklist_items;

CREATE POLICY "Staff select assigned house checklist items" ON public.house_checklist_items 
  FOR SELECT TO authenticated 
  USING (checklist_id IN (
    SELECT id FROM public.house_checklists 
    WHERE house_id IN (
      SELECT house_id FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  ));


-- FILE: 2026032005_fix_notifications_schema.sql

-- Fix notifications schema and RLS policies to match TypeScript implementation

-- ==========================================
-- PART 1: SCHEMA FIXES
-- ==========================================

-- 1. Add missing type column
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;

-- 2. Update existing rows to have a default type before making it NOT NULL
UPDATE public.notifications SET type = 'system_alert' WHERE type IS NULL;

-- 3. Make type NOT NULL
ALTER TABLE public.notifications ALTER COLUMN type SET NOT NULL;

-- 4. Rename message to body (if message column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN message TO body;
  END IF;
END $$;

-- 5. Add performance indices 
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);

-- 6. Enable Realtime for notifications table so topbar toasts work
BEGIN;
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
    ) THEN
      -- Create the publication if it somehow doesn't exist (Supabase standard)
      IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
         CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
      END IF;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END $$;
COMMIT;

-- ==========================================
-- PART 2: RLS POLICY FIXES
-- ==========================================

-- 1. Remove the restrictive blanket policy
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;

-- 2. Create granular policies

-- Users can only read, update (mark as read), and delete their OWN notifications
CREATE POLICY "Users select own notifications" ON public.notifications 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own notifications" ON public.notifications 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- ANY authenticated user can INSERT a notification for someone else
CREATE POLICY "Users insert notifications" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (true);


-- FILE: 2026032300_add_section_header_to_checklists.sql

-- Migration: Add group_title to checklist items
-- Date: 2026-03-23

-- Add group_title to checklist_item_master
ALTER TABLE public.checklist_item_master
ADD COLUMN IF NOT EXISTS group_title text NULL;

-- Add group_title to house_checklist_items
ALTER TABLE public.house_checklist_items
ADD COLUMN IF NOT EXISTS group_title text NULL;


-- FILE: 2026032301_refined_checklist_system.sql

-- Migration: Refined Checklist System (Consolidated)
-- Date: 2026-03-23
-- Description: Merges type/shift targeting and NOT NULL enforcement

-- 1. Create Enums for Types and Shifts
DO $$ BEGIN
    CREATE TYPE public.checklist_type_enum AS ENUM ('daily_house', 'start_of_shift', 'end_of_shift');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shift_period_enum AS ENUM ('morning', 'day', 'night', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update checklist_master
ALTER TABLE public.checklist_master
ADD COLUMN IF NOT EXISTS type public.checklist_type_enum NOT NULL DEFAULT 'daily_house',
ADD COLUMN IF NOT EXISTS target_shift public.shift_period_enum NOT NULL DEFAULT 'all';

-- 3. Update house_checklists
ALTER TABLE public.house_checklists
ADD COLUMN IF NOT EXISTS type public.checklist_type_enum NOT NULL DEFAULT 'daily_house',
ADD COLUMN IF NOT EXISTS target_shift public.shift_period_enum NOT NULL DEFAULT 'all';

-- 4. Update checklist_item_master
-- Add group_title if not exists, then backfill, then set NOT NULL
ALTER TABLE public.checklist_item_master ADD COLUMN IF NOT EXISTS group_title text NULL;
UPDATE public.checklist_item_master SET group_title = 'Morning' WHERE group_title IS NULL;
ALTER TABLE public.checklist_item_master ALTER COLUMN group_title SET NOT NULL;

-- Add constraint for allowed values
ALTER TABLE public.checklist_item_master DROP CONSTRAINT IF EXISTS checklist_item_master_group_title_check;
ALTER TABLE public.checklist_item_master ADD CONSTRAINT checklist_item_master_group_title_check 
CHECK (group_title IN ('Morning', 'Day', 'Night'));

-- 5. Update house_checklist_items
-- Add group_title if not exists, then backfill, then set NOT NULL
ALTER TABLE public.house_checklist_items ADD COLUMN IF NOT EXISTS group_title text NULL;
UPDATE public.house_checklist_items SET group_title = 'Morning' WHERE group_title IS NULL;
ALTER TABLE public.house_checklist_items ALTER COLUMN group_title SET NOT NULL;

-- Add constraint for allowed values
ALTER TABLE public.house_checklist_items DROP CONSTRAINT IF EXISTS house_checklist_items_group_title_check;
ALTER TABLE public.house_checklist_items ADD CONSTRAINT house_checklist_items_group_title_check 
CHECK (group_title IN ('Morning', 'Day', 'Night'));


-- FILE: 2026032303_link_checklists_to_shifts.sql

-- Migration: Shift Checklist System (Consolidated)
-- Date: 2026-03-23
-- Description: Links checklists to shifts via junction table and adds period targeting.

-- 1. Ensure Shift Period Enum exists (Morning, Day, Night, All)
DO $$ BEGIN
    CREATE TYPE public.shift_period_enum AS ENUM ('morning', 'day', 'night', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update house_calendar_events to support period-based color coding
ALTER TABLE public.house_calendar_events
ADD COLUMN IF NOT EXISTS target_shift public.shift_period_enum NOT NULL DEFAULT 'all';

-- 3. Update checklist_schedules to support period-based generation
ALTER TABLE public.checklist_schedules
ADD COLUMN IF NOT EXISTS target_shift public.shift_period_enum NOT NULL DEFAULT 'all';

-- 4. Create the junction table for shift-specific assignments
CREATE TABLE IF NOT EXISTS public.shift_assigned_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_id uuid NOT NULL REFERENCES public.staff_shifts(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    assignment_title text NOT NULL, -- e.g. "Start of Shift", "Medication Round"
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    
    -- Ensure a checklist isn't assigned to the same shift twice with the same role
    UNIQUE(shift_id, checklist_id, assignment_title)
);

-- 5. Enable RLS
ALTER TABLE public.shift_assigned_checklists ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
DROP POLICY IF EXISTS "Users can view shift assignments for their houses" ON public.shift_assigned_checklists;
CREATE POLICY "Users can view shift assignments for their houses"
    ON public.shift_assigned_checklists FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage shift assignments" ON public.shift_assigned_checklists;
CREATE POLICY "Admins can manage shift assignments"
    ON public.shift_assigned_checklists FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Add reference to junction table in submissions
ALTER TABLE public.house_checklist_submissions
ADD COLUMN IF NOT EXISTS shift_assignment_id uuid REFERENCES public.shift_assigned_checklists(id) ON DELETE SET NULL;

-- 8. Add comments for documentation
COMMENT ON COLUMN public.house_calendar_events.target_shift IS 'Target shift period for this event (Morning, Day, Night, All)';
COMMENT ON COLUMN public.checklist_schedules.target_shift IS 'Default target shift period for events generated by this schedule';
COMMENT ON TABLE public.shift_assigned_checklists IS 'Junction table linking specific checklist templates to rostered shifts with custom titles';


-- FILE: 2026032304_add_metadata_to_notifications.sql

-- Migration: Add metadata to notifications
-- Date: 2026-03-23

-- Add metadata column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb NULL;

-- Log the change
COMMENT ON COLUMN public.notifications.metadata IS 'JSON metadata for notification context (e.g. participantId, tab reference)';


-- FILE: 2026032400_create_monday_checklist.sql

DO $$
DECLARE
    v_house_id uuid := '51b47c06-ce82-48e0-ae04-5e3283955c6e';
    v_checklist_id uuid;
BEGIN
    INSERT INTO public.house_checklists (
        house_id, 
        name, 
        frequency, 
        description, 
        days_of_week
    )
    VALUES (
        v_house_id, 
        'Monday', 
        'weekly', 
        'Monday House Calendar checklist', 
        ARRAY['Monday']
    )
    RETURNING id INTO v_checklist_id;

    -- Morning Tasks
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_checklist_id, 'Turn off outside lights near the kitchen', 'Morning', 10),
    (v_checklist_id, 'Check feedback & complaint form (if something is in, tell Donna)', 'Morning', 20),
    (v_checklist_id, 'Record Fridge Temperature', 'Morning', 30),
    (v_checklist_id, 'Jas BGL before food', 'Morning', 40),
    (v_checklist_id, 'Promt Sheetal to brush teeth', 'Morning', 50),
    (v_checklist_id, 'Send signing sheets to Ea', 'Morning', 60);

    -- Day Tasks
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_checklist_id, 'Shop', 'Day', 70, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_checklist_id, 'Refill from costco items as needed', 'Day', 80, NULL),
    (v_checklist_id, 'Jasmine''s linen & room', 'Day', 90, NULL),
    (v_checklist_id, 'Vacuum', 'Day', 100, NULL);

    -- Night Tasks
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_checklist_id, 'Promt Sheetal to brush teeth', 'Night', 110, NULL),
    (v_checklist_id, 'Next day reminders for residents (appts, chores etc.)', 'Night', 120, 'Enter reminders given here:'),
    (v_checklist_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', 'Night', 130, 'If close to expiry, take action. Describe action here:'),
    (v_checklist_id, 'Mop', 'Night', 140, NULL),
    (v_checklist_id, 'Remind Jas to put cream on her foot', 'Night', 150, NULL);

    -- Start of Shift (Moved to Morning group for schema compatibility)
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_checklist_id, 'START OF SHIFT: Check emails & calendar - act accordingly', 'Morning', 160),
    (v_checklist_id, 'START OF SHIFT: Check what medication has been given', 'Morning', 170),
    (v_checklist_id, 'START OF SHIFT: Read all checklist and comms since your last shift', 'Morning', 180);

    -- End of Shift (Moved to Night group for schema compatibility)
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_checklist_id, 'END OF SHIFT: Have you filled out Jasmine''s Bowel tracker?', 'Night', 190),
    (v_checklist_id, 'END OF SHIFT: Have you put the phone and card back?', 'Night', 200),
    (v_checklist_id, 'END OF SHIFT: Have you signed for all medication?', 'Night', 210),
    (v_checklist_id, 'END OF SHIFT: Have you entered/canceled/moved appts as required?', 'Night', 220),
    (v_checklist_id, 'END OF SHIFT: Have you entered receipts?', 'Night', 230),
    (v_checklist_id, 'END OF SHIFT: Have you cleaned, put dishes away, emptied bins etc?', 'Night', 240),
    (v_checklist_id, 'END OF SHIFT: Have you done you SIL Shift Notes?', 'Night', 250);
END $$;


-- FILE: 2026032401_dynamic_shift_model.sql

-- Migration: Dynamic House Shift Model
-- Date: 2026-03-24
-- Description: Replaces hardcoded shift periods with a dynamic per-house shift model.

-- 1. Create the House Shift Types table
CREATE TABLE IF NOT EXISTS public.house_shift_types (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name text NOT NULL,
    short_name text NULL, -- e.g. 'M', 'D', 'N'
    icon_name text NULL, -- for UI icons
    color_theme text NULL, -- for period-specific colors
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT house_shift_types_pkey PRIMARY KEY (id),
    UNIQUE (house_id, name)
);

-- 2. Add foreign key to items
-- Note: We keep group_title for now to preserve existing data, but we'll transition to group_id
ALTER TABLE public.house_checklist_items ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;
ALTER TABLE public.checklist_item_master ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;

-- 3. Backfill common shift types for existing houses
-- This ensures the system doesn't break for existing data
DO $$
DECLARE
    r RECORD;
    v_m_id uuid;
    v_d_id uuid;
    v_n_id uuid;
BEGIN
    FOR r IN SELECT id FROM public.houses LOOP
        -- Morning
        INSERT INTO public.house_shift_types (house_id, name, short_name, icon_name, color_theme, sort_order)
        VALUES (r.id, 'Morning', 'M', 'sun', 'morning', 10)
        ON CONFLICT (house_id, name) DO UPDATE SET short_name = 'M'
        RETURNING id INTO v_m_id;

        -- Day
        INSERT INTO public.house_shift_types (house_id, name, short_name, icon_name, color_theme, sort_order)
        VALUES (r.id, 'Day', 'D', 'sun-dim', 'day', 20)
        ON CONFLICT (house_id, name) DO UPDATE SET short_name = 'D'
        RETURNING id INTO v_d_id;

        -- Night
        INSERT INTO public.house_shift_types (house_id, name, short_name, icon_name, color_theme, sort_order)
        VALUES (r.id, 'Night', 'N', 'moon', 'night', 30)
        ON CONFLICT (house_id, name) DO UPDATE SET short_name = 'N'
        RETURNING id INTO v_n_id;

        -- Link existing items to these new types based on their group_title
        UPDATE public.house_checklist_items 
        SET group_id = v_m_id 
        WHERE checklist_id IN (SELECT id FROM public.house_checklists WHERE house_id = r.id)
        AND (group_title = 'Morning' OR group_title = 'Morn');

        UPDATE public.house_checklist_items 
        SET group_id = v_d_id 
        WHERE checklist_id IN (SELECT id FROM public.house_checklists WHERE house_id = r.id)
        AND group_title = 'Day';

        UPDATE public.house_checklist_items 
        SET group_id = v_n_id 
        WHERE checklist_id IN (SELECT id FROM public.house_checklists WHERE house_id = r.id)
        AND group_title = 'Night';
    END LOOP;
END $$;

-- 4. Clean up old constraints (only if they exist)
-- We'll allow group_title to be NULL now since we'll use group_id
ALTER TABLE public.house_checklist_items ALTER COLUMN group_title DROP NOT NULL;
ALTER TABLE public.house_checklist_items DROP CONSTRAINT IF EXISTS house_checklist_items_group_title_check;

-- 5. Add RLS for the new table
ALTER TABLE public.house_shift_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view house_shift_types"
ON public.house_shift_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage house_shift_types"
ON public.house_shift_types FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.auth_user_id = auth.uid() AND (s.role_id IN (SELECT id FROM public.roles WHERE name = 'Administrator'))));

-- Add a comment for documentation
COMMENT ON TABLE public.house_shift_types IS 'Defines house-specific shift periods for task grouping.';


-- FILE: 2026032402_setup_house_source_of_truth.sql

DO $$
DECLARE
    v_house_id uuid := '51b47c06-ce82-48e0-ae04-5e3283955c6e';
    v_morning_id uuid;
    v_day_id uuid;
    v_night_id uuid;
    v_cl_mon_id uuid;
    v_cl_tue_id uuid;
    v_cl_wed_id uuid;
    v_cl_thu_id uuid;
    v_cl_fri_id uuid;
    v_cl_sat_id uuid;
    v_cl_sun_id uuid;
    v_cl_start_id uuid;
    v_cl_end_id uuid;
BEGIN
    -- 1. Get the dynamic shift IDs for this house
    SELECT id INTO v_morning_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Morning';
    SELECT id INTO v_day_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Day';
    SELECT id INTO v_night_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Night';

    -- 2. MONDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Monday Tasks', 'weekly', 'Facility tasks for Mondays', ARRAY['Monday'])
    RETURNING id INTO v_cl_mon_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_mon_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_mon_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_mon_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_mon_id, 'Jas BGL before food', v_morning_id, 'Morning', 40),
    (v_cl_mon_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_mon_id, 'Send signing sheets to Ea', v_morning_id, 'Morning', 60),
    (v_cl_mon_id, 'Refill from costco items as needed', v_day_id, 'Day', 70),
    (v_cl_mon_id, 'Jasmine''s linen & room', v_day_id, 'Day', 80),
    (v_cl_mon_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_mon_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_mon_id, 'Mop', v_night_id, 'Night', 110),
    (v_cl_mon_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 120);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_mon_id, 'Shop', v_day_id, 'Day', 130, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_mon_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_mon_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 3. TUESDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Tuesday Tasks', 'weekly', 'Facility tasks for Tuesdays', ARRAY['Tuesday'])
    RETURNING id INTO v_cl_tue_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_tue_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_tue_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_tue_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_tue_id, 'Check mailbox & action', v_morning_id, 'Morning', 40),
    (v_cl_tue_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_tue_id, 'Check medication (call pharmacy if on last week)', v_day_id, 'Day', 60),
    (v_cl_tue_id, 'Container for change when all girls are on support', v_day_id, 'Day', 70),
    (v_cl_tue_id, 'SW linen & clean SW bedroom', v_day_id, 'Day', 80),
    (v_cl_tue_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_tue_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_tue_id, 'Add new week menu to whiteboard', v_night_id, 'Night', 110),
    (v_cl_tue_id, 'Mop', v_night_id, 'Night', 120),
    (v_cl_tue_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 130);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_tue_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_tue_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 4. WEDNESDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Wednesday Tasks', 'weekly', 'Facility tasks for Wednesdays', ARRAY['Wednesday'])
    RETURNING id INTO v_cl_wed_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_wed_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_wed_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_wed_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_wed_id, 'Clean toilets', v_morning_id, 'Morning', 40),
    (v_cl_wed_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_wed_id, 'Jas Ozempic', v_morning_id, 'Morning', 60),
    (v_cl_wed_id, 'Exercise with Jasmine (Marco''s program)', v_day_id, 'Day', 70),
    (v_cl_wed_id, 'Vacuum', v_day_id, 'Day', 80),
    (v_cl_wed_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 90),
    (v_cl_wed_id, 'Bin night', v_night_id, 'Night', 100),
    (v_cl_wed_id, 'Mop', v_night_id, 'Night', 110),
    (v_cl_wed_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 120);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_wed_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 130, 'Enter reminders given here:'),
    (v_cl_wed_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 140, 'If close to expiry, take action. Describe action here:');

    -- 5. THURSDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Thursday Tasks', 'weekly', 'Facility tasks for Thursdays', ARRAY['Thursday'])
    RETURNING id INTO v_cl_thu_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_thu_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_thu_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_thu_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_thu_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 40),
    (v_cl_thu_id, 'Pick up medication if ordered', v_day_id, 'Day', 50),
    (v_cl_thu_id, 'Sheetel''s linen & room', v_day_id, 'Day', 60),
    (v_cl_thu_id, 'Vacuum', v_day_id, 'Day', 70),
    (v_cl_thu_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 80),
    (v_cl_thu_id, 'Mop', v_night_id, 'Night', 90),
    (v_cl_thu_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 100);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_thu_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 110, 'Enter reminders given here:'),
    (v_cl_thu_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 120, 'If close to expiry, take action. Describe action here:');

    -- 6. FRIDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Friday Tasks', 'weekly', 'Facility tasks for Fridays', ARRAY['Friday'])
    RETURNING id INTO v_cl_fri_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_fri_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_fri_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_fri_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_fri_id, 'Jas BGL before food', v_morning_id, 'Morning', 40),
    (v_cl_fri_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_fri_id, 'Caroline linen & room', v_day_id, 'Day', 60),
    (v_cl_fri_id, 'Vacuum', v_day_id, 'Day', 70),
    (v_cl_fri_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 80),
    (v_cl_fri_id, 'Mop', v_night_id, 'Night', 90),
    (v_cl_fri_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 100);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_fri_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 110, 'Enter reminders given here:'),
    (v_cl_fri_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 120, 'If close to expiry, take action. Describe action here:');

    -- 7. SATURDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Saturday Tasks', 'weekly', 'Facility tasks for Saturdays', ARRAY['Saturday'])
    RETURNING id INTO v_cl_sat_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_sat_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_sat_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_sat_id, 'Record fridge temperature', v_morning_id, 'Morning', 30),
    (v_cl_sat_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 40),
    (v_cl_sat_id, 'Weeding (10/15mins)', v_morning_id, 'Morning', 50),
    (v_cl_sat_id, 'Meal Spreadsheet', v_day_id, 'Day', 60),
    (v_cl_sat_id, 'Deep clean bathrooms & laundry', v_day_id, 'Day', 70),
    (v_cl_sat_id, 'Vacuum', v_day_id, 'Day', 80),
    (v_cl_sat_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 90),
    (v_cl_sat_id, 'Mop', v_night_id, 'Night', 100),
    (v_cl_sat_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 110);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_sat_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 120, 'Enter reminders given here:'),
    (v_cl_sat_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 130, 'If close to expiry, take action. Describe action here:');

    -- 8. SUNDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Sunday Tasks', 'weekly', 'Facility tasks for Sundays', ARRAY['Sunday'])
    RETURNING id INTO v_cl_sun_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_sun_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_sun_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_sun_id, 'Record fridge temperature', v_morning_id, 'Morning', 30),
    (v_cl_sun_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 40),
    (v_cl_sun_id, 'Weeding (10/15mins)', v_morning_id, 'Morning', 50),
    (v_cl_sun_id, 'SW linen & clean SW bedroom', v_day_id, 'Day', 60),
    (v_cl_sun_id, 'Outdoor tidy up', v_day_id, 'Day', 70),
    (v_cl_sun_id, 'Deep clean shared areas (e.g. theatre room, quiet space…)', v_day_id, 'Day', 80),
    (v_cl_sun_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_sun_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_sun_id, 'Add new week menu to whiteboard', v_night_id, 'Night', 110),
    (v_cl_sun_id, 'Mop', v_night_id, 'Night', 120),
    (v_cl_sun_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 130);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_sun_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_sun_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 9. STANDARDIZED SHIFT CHECKLISTS (Created ONCE per house)
    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'Start of Shift', 'daily', 'Standard prep tasks for the beginning of every shift')
    RETURNING id INTO v_cl_start_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_cl_start_id, 'Check emails & calendar - act accordingly', 'General', 10, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_start_id, 'Check what medication has been given', 'General', 20, NULL),
    (v_cl_start_id, 'Read all checklist and comms since your last shift', 'General', 30, NULL);

    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'End of Shift', 'daily', 'Standard handover and wrap-up tasks for the end of every shift')
    RETURNING id INTO v_cl_end_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_cl_end_id, 'Have you filled out Jasmine''s Bowel tracker?', 'General', 10),
    (v_cl_end_id, 'Have you put the phone and card back?', 'General', 20),
    (v_cl_end_id, 'Have you signed for all medication?', 'General', 30),
    (v_cl_end_id, 'Have you entered/canceled/moved appts as required?', 'General', 40),
    (v_cl_end_id, 'Have you entered receipts?', 'General', 50),
    (v_cl_end_id, 'Have you cleaned, put dishes away, emptied bins etc?', 'General', 60),
    (v_cl_end_id, 'Have you done you SIL Shift Notes?', 'General', 70);

END $$;


-- FILE: 2026032402_setup_monday_source_of_truth.sql

DO $$
DECLARE
    v_house_id uuid := '51b47c06-ce82-48e0-ae04-5e3283955c6e';
    v_morning_id uuid;
    v_day_id uuid;
    v_night_id uuid;
    v_cl_mon_id uuid;
    v_cl_tue_id uuid;
    v_cl_start_id uuid;
    v_cl_end_id uuid;
BEGIN
    -- 1. Get the dynamic shift IDs for this house (Created by the 2026032401 migration)
    SELECT id INTO v_morning_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Morning';
    SELECT id INTO v_day_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Day';
    SELECT id INTO v_night_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Night';

    -- 2. Create the shared "Monday Tasks" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Monday Tasks', 'weekly', 'Shared facility tasks for Mondays', ARRAY['Monday'])
    RETURNING id INTO v_cl_mon_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_mon_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_mon_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_mon_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_mon_id, 'Jas BGL before food', v_morning_id, 'Morning', 40),
    (v_cl_mon_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_mon_id, 'Send signing sheets to Ea', v_morning_id, 'Morning', 60),
    (v_cl_mon_id, 'Refill from costco items as needed', v_day_id, 'Day', 70),
    (v_cl_mon_id, 'Jasmine''s linen & room', v_day_id, 'Day', 80),
    (v_cl_mon_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_mon_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_mon_id, 'Mop', v_night_id, 'Night', 110),
    (v_cl_mon_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 120);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_mon_id, 'Shop', v_day_id, 'Day', 130, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_mon_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_mon_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 3. Create the shared "Tuesday Tasks" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Tuesday Tasks', 'weekly', 'Shared facility tasks for Tuesdays', ARRAY['Tuesday'])
    RETURNING id INTO v_cl_tue_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_tue_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_tue_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_tue_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_tue_id, 'Check mailbox & action', v_morning_id, 'Morning', 40),
    (v_cl_tue_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_tue_id, 'Check medication (call pharmacy if on last week)', v_day_id, 'Day', 60),
    (v_cl_tue_id, 'Container for change when all girls are on support', v_day_id, 'Day', 70),
    (v_cl_tue_id, 'SW linen & clean SW bedroom', v_day_id, 'Day', 80),
    (v_cl_tue_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_tue_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_tue_id, 'Add new week menu to whiteboard', v_night_id, 'Night', 110),
    (v_cl_tue_id, 'Mop', v_night_id, 'Night', 120),
    (v_cl_tue_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 130);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_tue_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_tue_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 4. Create the standard "Start of Shift" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'Start of Shift', 'daily', 'Prep tasks for the beginning of every shift')
    RETURNING id INTO v_cl_start_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_cl_start_id, 'Check emails & calendar - act accordingly', 'General', 10, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_start_id, 'Check what medication has been given', 'General', 20, NULL),
    (v_cl_start_id, 'Read all checklist and comms since your last shift', 'General', 30, NULL);

    -- 5. Create the standard "End of Shift" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'End of Shift', 'daily', 'Handover and wrap-up tasks for the end of every shift')
    RETURNING id INTO v_cl_end_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_cl_end_id, 'Have you filled out Jasmine''s Bowel tracker?', 'General', 10),
    (v_cl_end_id, 'Have you put the phone and card back?', 'General', 20),
    (v_cl_end_id, 'Have you signed for all medication?', 'General', 30),
    (v_cl_end_id, 'Have you entered/canceled/moved appts as required?', 'General', 40),
    (v_cl_end_id, 'Have you entered receipts?', 'General', 50),
    (v_cl_end_id, 'Have you cleaned, put dishes away, emptied bins etc?', 'General', 60),
    (v_cl_end_id, 'Have you done you SIL Shift Notes?', 'General', 70);

END $$;


-- FILE: 2026032403_roster_template_enhancements.sql

-- Migration: Roster & Shift Template Enhancements
-- Date: 2026-03-24
-- Description: Enables Open Shifts and adds default timing to shift types.

-- 1. Enable Open Shifts (Nullable Staff ID)
ALTER TABLE public.staff_shifts ALTER COLUMN staff_id DROP NOT NULL;

-- 2. Add default times to Shift Types
ALTER TABLE public.house_shift_types ADD COLUMN IF NOT EXISTS default_start_time time without time zone;
ALTER TABLE public.house_shift_types ADD COLUMN IF NOT EXISTS default_end_time time without time zone;

-- 3. Populate default times for standard shifts
UPDATE public.house_shift_types SET default_start_time = '07:00:00', default_end_time = '15:00:00' WHERE name = 'Morning';
UPDATE public.house_shift_types SET default_start_time = '15:00:00', default_end_time = '23:00:00' WHERE name = 'Day';
UPDATE public.house_shift_types SET default_start_time = '23:00:00', default_end_time = '07:00:00' WHERE name = 'Night';

-- 4. Ensure junction table uses dynamic IDs
-- (The shift_assigned_checklists table already exists, ensuring it handles the mapping)

COMMENT ON COLUMN public.staff_shifts.staff_id IS 'If NULL, this is an Open Shift available for assignment.';
COMMENT ON COLUMN public.house_shift_types.default_start_time IS 'Used to auto-populate the roster skeleton.';


-- FILE: 2026032404_fix_shift_assigned_checklists.sql

-- Migration: Fix Shift Assigned Checklists Schema
-- Date: 2026-03-24
-- Description: Adds missing columns to link routines to houses and shift types directly.

-- 1. Add House ID and Shift Type ID to the mapping table
ALTER TABLE public.shift_assigned_checklists ADD COLUMN IF NOT EXISTS house_id uuid REFERENCES public.houses(id) ON DELETE CASCADE;
ALTER TABLE public.shift_assigned_checklists ADD COLUMN IF NOT EXISTS shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE CASCADE;

-- 2. Make shift_id nullable (as it can now be a template rule OR a specific roster link)
ALTER TABLE public.shift_assigned_checklists ALTER COLUMN shift_id DROP NOT NULL;

-- 3. Update comments
COMMENT ON COLUMN public.shift_assigned_checklists.shift_id IS 'If NULL, this is a routine rule for all shifts of a specific type in a house.';
COMMENT ON COLUMN public.shift_assigned_checklists.shift_type_id IS 'Links the routine to a dynamic house shift type (Morning, Night, etc).';


-- FILE: 2026032405_add_checklist_sort_order.sql

-- Migration: Add sort_order to house_checklists
-- Date: 2026-03-24
-- Description: Adds a sort_order column to allow manual re-ordering of checklists within a house.

ALTER TABLE public.house_checklists ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.house_checklists.sort_order IS 'Determines the display order of checklists in the House Setup UI.';


-- FILE: 2026032406_house_setup_tracking.sql

-- Migration: House Setup Progress Tracking
-- Date: 2026-03-24
-- Description: Adds persistent progress tracking for the House Setup Wizard.

-- 1. Add progress tracking columns
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS setup_step integer NOT NULL DEFAULT 1;
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS is_configured boolean NOT NULL DEFAULT false;

-- 2. Add comments for documentation
COMMENT ON COLUMN public.houses.setup_step IS 'The last completed or current step in the 5-step Setup Wizard.';
COMMENT ON COLUMN public.houses.is_configured IS 'When true, the house is considered operational and visible to staff.';

-- 3. Initial check: If a house already has checklists or shifts, mark it as step 5 / configured
-- This prevents the wizard from popping up for existing, established houses.
UPDATE public.houses 
SET setup_step = 5, is_configured = true
WHERE id IN (SELECT house_id FROM public.house_checklists)
OR id IN (SELECT house_id FROM public.staff_shifts);


-- FILE: 2026032407_consolidated_schema_fix.sql

-- Migration: Consolidated Roster & Checklist Schema Fix (V2 - Clean)
-- Date: 2026-03-24
-- Description: Ensures all required columns for Roster, Setup Tracking, and Checklist Re-ordering exist.

-- 1. Staff Shifts Table (Open Shifts)
DO $$
BEGIN
  -- Enable Open Shifts by making staff_id nullable
  ALTER TABLE public.staff_shifts ALTER COLUMN staff_id DROP NOT NULL;
END $$;

-- 2. Shift Assigned Checklists (Routine Mapping)
DO $$
BEGIN
  -- Add House ID and Shift Type ID to the mapping table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assigned_checklists' AND column_name = 'house_id') THEN
    ALTER TABLE public.shift_assigned_checklists ADD COLUMN house_id uuid REFERENCES public.houses(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_assigned_checklists' AND column_name = 'shift_type_id') THEN
    ALTER TABLE public.shift_assigned_checklists ADD COLUMN shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE CASCADE;
  END IF;
  
  -- Ensure shift_id is nullable for template routines (rules applied to shift types)
  ALTER TABLE public.shift_assigned_checklists ALTER COLUMN shift_id DROP NOT NULL;
END $$;

-- 3. Houses Table (Setup Tracking)
DO $$
BEGIN
  -- Add setup progress tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'setup_step') THEN
    ALTER TABLE public.houses ADD COLUMN setup_step integer NOT NULL DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'is_configured') THEN
    ALTER TABLE public.houses ADD COLUMN is_configured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. House Checklists (Re-ordering)
DO $$
BEGIN
  -- Add sort_order for manual checklist organization
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'house_checklists' AND column_name = 'sort_order') THEN
    ALTER TABLE public.house_checklists ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;


-- FILE: 2026032409_house_roster_patterns.sql

-- Migration: House Roster Patterns
-- Date: 2026-03-24
-- Description: Stores the 7-day coverage blueprint for a house to enable bulk deployment.

CREATE TABLE IF NOT EXISTS public.house_roster_patterns (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    day_of_week text NOT NULL, -- 'Monday', 'Tuesday', etc.
    shift_type_id uuid NOT NULL REFERENCES public.house_shift_types(id) ON DELETE CASCADE,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Prevents identical pattern entries for the same house/day/time
    UNIQUE(house_id, day_of_week, shift_type_id, start_time)
);

-- Enable RLS
ALTER TABLE public.house_roster_patterns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated to view house_roster_patterns"
ON public.house_roster_patterns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage house_roster_patterns"
ON public.house_roster_patterns FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.house_roster_patterns IS 'Stores the recurring 7-day requirement blueprint for a house.';


-- FILE: 2026032410_shift_templates.sql

-- Migration: Shift Templates
-- Date: 2026-03-24

-- 1. Rename the existing table
ALTER TABLE IF EXISTS public.house_roster_patterns RENAME TO house_shift_templates;

-- 2. Rename policies (if they exist, ignore errors if they don't, but standard SQL doesn't have IF EXISTS for policy rename, so we just do it)
-- Note: Supabase UI sometimes complains, so we drop and recreate
DROP POLICY IF EXISTS "Allow authenticated to view house_roster_patterns" ON public.house_shift_templates;
DROP POLICY IF EXISTS "Allow admins to manage house_roster_patterns" ON public.house_shift_templates;

CREATE POLICY "Allow authenticated to view house_shift_templates"
ON public.house_shift_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage house_shift_templates"
ON public.house_shift_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Create a table to link checklists to shift templates
CREATE TABLE IF NOT EXISTS public.shift_template_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_template_id uuid NOT NULL REFERENCES public.house_shift_templates(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_template_id, checklist_id)
);

ALTER TABLE public.shift_template_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to view shift_template_checklists" ON public.shift_template_checklists;
CREATE POLICY "Allow authenticated to view shift_template_checklists"
ON public.shift_template_checklists FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admins to manage shift_template_checklists" ON public.shift_template_checklists;
CREATE POLICY "Allow admins to manage shift_template_checklists"
ON public.shift_template_checklists FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Update the submissions table
ALTER TABLE public.house_checklist_submissions ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.staff_shifts(id) ON DELETE CASCADE;
ALTER TABLE public.house_checklist_submissions ADD COLUMN IF NOT EXISTS shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;


-- FILE: 2026032500_refactor_shift_templates.sql

-- Migration: Flexible Shift Templates & Dynamic Scheduling
-- Date: 2026-03-25
-- Description: Refactors Shift Templates to support titled groups, custom checklists, and recurring patterns.

-- 1. Default Checklists for Shift Types
-- Allows an Admin to say "Every 'Morning' shift in this house should have 'Med Round' by default"
CREATE TABLE IF NOT EXISTS public.shift_type_default_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_type_id uuid NOT NULL REFERENCES public.house_shift_types(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_type_id, checklist_id)
);

-- 2. Shift Template Groups (The "Title")
-- Example: 'Weekday', 'Weekend', 'Christmas Day'
CREATE TABLE IF NOT EXISTS public.shift_template_groups (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Shift Template Items (The shifts within a template)
-- A 'Weekday' template might have Morning, Day, and Night shift items.
CREATE TABLE IF NOT EXISTS public.shift_template_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_group_id uuid NOT NULL REFERENCES public.shift_template_groups(id) ON DELETE CASCADE,
    shift_type_id uuid NOT NULL REFERENCES public.house_shift_types(id) ON DELETE CASCADE,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Shift Template Item Checklists (Custom Overrides)
-- Allows adding/removing checklists for a shift *inside* a specific template.
CREATE TABLE IF NOT EXISTS public.shift_template_item_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_template_item_id uuid NOT NULL REFERENCES public.shift_template_items(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_template_item_id, checklist_id)
);

-- 5. Shift Template Schedules (Recurrence)
-- Consistent with checklist_schedules
CREATE TABLE IF NOT EXISTS public.shift_template_schedules (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_group_id uuid NOT NULL REFERENCES public.shift_template_groups(id) ON DELETE CASCADE,
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    rrule text NOT NULL,
    start_date date NOT NULL,
    end_date date NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE public.shift_type_default_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_item_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_schedules ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Allow Authenticated View, Admins Manage)
-- Default Checklists
CREATE POLICY "Allow auth view default checklists" ON public.shift_type_default_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage default checklists" ON public.shift_type_default_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Template Groups
CREATE POLICY "Allow auth view template groups" ON public.shift_template_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template groups" ON public.shift_template_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Template Items
CREATE POLICY "Allow auth view template items" ON public.shift_template_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template items" ON public.shift_template_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Item Checklists
CREATE POLICY "Allow auth view item checklists" ON public.shift_template_item_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage item checklists" ON public.shift_template_item_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Schedules
CREATE POLICY "Allow auth view template schedules" ON public.shift_template_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template schedules" ON public.shift_template_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Deprecation Comment
COMMENT ON TABLE public.house_shift_templates IS 'DEPRECATED: Replaced by shift_template_groups/items hierarchy.';

-- 9. Add metadata to shifts to track template source
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS template_item_id uuid REFERENCES public.shift_template_items(id) ON DELETE SET NULL;


-- FILE: 2026032501_harden_staff_shifts_rls.sql

-- Migration: Harden RLS for staff_shifts
-- Date: 2026-03-25
-- Description: Restricts staff shift visibility to own shifts or Open Shifts in assigned houses.

-- 1. Drop existing permissive policy
DROP POLICY IF EXISTS "Staff can select staff shifts" ON public.staff_shifts;

-- 2. Create refined policy for Staff
-- Logic: 
--  - Can see shifts assigned to them (staff_id = their staff id)
--  - OR Can see "Open Shifts" (staff_id is NULL) for houses they are assigned to
CREATE POLICY "Staff can select scoped shifts" ON public.staff_shifts 
FOR SELECT 
TO authenticated 
USING (
    -- Admin check (already covered by global admin policy, but good for clarity if that fails)
    ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
    OR
    -- Supervisor check (if they have the role in metadata or via a join)
    ((auth.jwt() -> 'user_metadata' ->> 'role_name') ILIKE '%Supervisor%')
    OR
    -- Own shifts
    (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()))
    OR
    -- Open shifts for assigned houses
    (staff_id IS NULL AND house_id IN (
        SELECT house_id 
        FROM public.house_staff_assignments hsa 
        JOIN public.staff s ON s.id = hsa.staff_id 
        WHERE s.auth_user_id = auth.uid()
    ))
);

-- 3. Ensure Staff can read House assignments (needed for the join above)
-- Existing policies might already cover this, but we'll be explicit.
ALTER TABLE public.house_staff_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can select assigned house staff" ON public.house_staff_assignments;
CREATE POLICY "Staff can select house assignments" ON public.house_staff_assignments
FOR SELECT
TO authenticated
USING (true); -- Usually safe for staff to see who else is in their house

-- 4. Comment for documentation
COMMENT ON POLICY "Staff can select scoped shifts" ON public.staff_shifts IS 'Restricts staff to own shifts or Open Shifts in their assigned houses.';


-- FILE: 2026032502_standardize_shift_rls.sql

-- Migration: Standardize RLS for Shift Models
-- Date: 2026-03-25
-- Description: Standardizes RLS policies to allow authenticated users to manage shift models, matching checklist/participant patterns.

-- 1. Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Allow admins to manage house_shift_types" ON public.house_shift_types;

-- 2. Add standardized manage policy
CREATE POLICY "Allow authenticated to manage house_shift_types"
ON public.house_shift_types FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Standardize Template Groups (just in case)
DROP POLICY IF EXISTS "Allow admin manage template groups" ON public.shift_template_groups;
CREATE POLICY "Allow authenticated to manage template groups"
ON public.shift_template_groups FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Standardize Template Items
DROP POLICY IF EXISTS "Allow admin manage template items" ON public.shift_template_items;
CREATE POLICY "Allow authenticated to manage template items"
ON public.shift_template_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- FILE: 2026032503_link_shifts_to_types.sql

-- Migration: Link Staff Shifts to Shift Types
-- Date: 2026-03-25
-- Description: Adds a formal foreign key from staff_shifts to house_shift_types for dynamic styling.

-- 1. Add the column
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;

-- 2. Backfill existing shifts based on name matching
DO $$
BEGIN
    UPDATE public.staff_shifts ss
    SET shift_type_id = hst.id
    FROM public.house_shift_types hst
    WHERE ss.house_id = hst.house_id
    AND ss.shift_type = hst.name
    AND ss.shift_type_id IS NULL;
END $$;

-- 3. Comment for documentation
COMMENT ON COLUMN public.staff_shifts.shift_type_id IS 'Link to the dynamic shift model for icons and colors.';


-- FILE: 2026032600_org_shift_templates.sql

-- Migration: Organization Level Shift Templates
-- Date: 2026-03-26
-- Description: Creates global shift modes (Morning, Day, Night, etc.) at the organization level.

-- 1. Create the Org Shift Templates table
CREATE TABLE IF NOT EXISTS public.org_shift_templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    short_name text NULL,
    start_time_default time without time zone NULL,
    end_time_default time without time zone NULL,
    icon_name text NULL,
    color_theme text NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_shift_templates_pkey PRIMARY KEY (id),
    UNIQUE (name)
);

-- 2. Add foreign key to staff_shifts (Nullable to keep old data working)
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS org_shift_template_id uuid REFERENCES public.org_shift_templates(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.org_shift_templates ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Allow authenticated to view org_shift_templates"
ON public.org_shift_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage org_shift_templates"
ON public.org_shift_templates FOR ALL
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- 5. Backfill common defaults with correct color_theme and icon_name from SHIFT_ICONS
INSERT INTO public.org_shift_templates (name, short_name, start_time_default, end_time_default, icon_name, color_theme, sort_order)
VALUES 
('Morning', 'M', '07:00', '15:00', 'Sun', 'morning', 10),
('Day', 'D', '09:00', '17:00', 'CloudSun', 'day', 20),
('Afternoon', 'A', '15:00', '23:00', 'Sunset', 'afternoon', 25),
('Night', 'N', '23:00', '07:00', 'Moon', 'night', 30),
('Sleepover', 'S', '22:00', '08:00', 'Bed', 'night', 40),
('Community', 'C', '09:00', '17:00', 'Users', 'community', 50)
ON CONFLICT (name) DO NOTHING;


-- FILE: 2026032601_org_shift_template_checklists.sql

-- Migration: Org Shift Template Default Checklists
-- Date: 2026-03-26
-- Description: Allows linking global shift modes to master checklist templates.

-- 1. Create the link table
CREATE TABLE IF NOT EXISTS public.org_shift_template_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    org_shift_template_id uuid REFERENCES public.org_shift_templates(id) ON DELETE CASCADE,
    checklist_master_id uuid REFERENCES public.checklist_master(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_shift_template_checklists_pkey PRIMARY KEY (id),
    UNIQUE (org_shift_template_id, checklist_master_id)
);

-- 2. Enable RLS
ALTER TABLE public.org_shift_template_checklists ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Allow authenticated to view org_shift_template_checklists"
ON public.org_shift_template_checklists FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage org_shift_template_checklists"
ON public.org_shift_template_checklists FOR ALL
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);


-- FILE: 2026032602_remove_checklist_frequency.sql

-- Migration: Remove frequency column from checklists
-- Description: The frequency column is redundant as scheduling is now handled via Path A (House Calendar) or Path B (Shift Routines).

ALTER TABLE public.checklist_master DROP COLUMN IF EXISTS frequency;
ALTER TABLE public.house_checklists DROP COLUMN IF EXISTS frequency;


-- FILE: 2026032900_shift_template_participants.sql


-- Migration: Link Participants to Shift Template Items
-- Date: 2026-03-29
-- Description: Adds a mapping table to link participants directly to shift template items, ensuring they are automatically assigned when a template is materialized.

CREATE TABLE IF NOT EXISTS public.shift_template_item_participants (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_template_item_id uuid NOT NULL REFERENCES public.shift_template_items(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_template_item_id, participant_id)
);

ALTER TABLE public.shift_template_item_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow auth view template item participants" ON public.shift_template_item_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template item participants" ON public.shift_template_item_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- FILE: 2026032901_rename_shift_date_to_start_date.sql

-- Migration: Rename shift_date to start_date in staff_shifts
-- Date: 2026-03-29
-- Description: Standardizing column names for clarity before go-live.

ALTER TABLE public.staff_shifts RENAME COLUMN shift_date TO start_date;
ALTER TABLE public.shift_notes RENAME COLUMN shift_date TO start_date;

-- Update the index name as well for consistency
ALTER INDEX IF EXISTS idx_staff_shifts_date RENAME TO idx_staff_shifts_start_date;
ALTER INDEX IF EXISTS idx_shift_notes_shift_date RENAME TO idx_shift_notes_start_date;


-- FILE: 2026033100_remove_shift_status.sql

-- Migration to remove 'status' column from 'staff_shifts' table
-- This field is no longer needed as per user request.

ALTER TABLE staff_shifts DROP COLUMN IF EXISTS status;


-- FILE: 2026040100_add_status_to_roles.sql

-- Migration: Add status to roles table
-- Date: 2026-04-01
-- Description: Adds a boolean is_active column to allow soft-deactivation of roles.

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Ensure all existing roles are active
UPDATE public.roles SET is_active = true WHERE is_active IS NULL;

COMMENT ON COLUMN public.roles.is_active IS 'Whether the role is available for selection in dropdowns.';


-- FILE: 2026040300_remove_shift_templates.sql

-- Migration: Remove Shift Template System
-- Description: Drops redundant tables associated with the legacy shift template system
-- tables being replaced by 'Shift Model' (house_shift_types) and the 'Populate Roster' tool.

-- 1. Drop junction tables first to satisfy foreign key constraints
DROP TABLE IF EXISTS public.shift_template_item_participants CASCADE;
DROP TABLE IF EXISTS public.shift_template_item_checklists CASCADE;

-- 2. Drop item and schedule tables
DROP TABLE IF EXISTS public.shift_template_items CASCADE;
DROP TABLE IF EXISTS public.shift_template_schedules CASCADE;

-- 3. Drop the main groups table
DROP TABLE IF EXISTS public.shift_template_groups CASCADE;

-- 4. Cleanup any orphan references if any (optional, but good practice)
-- No orphan references identified that would cause issues.


-- FILE: 2026040400_remove_org_shift_templates.sql

-- Migration: Remove Organization Level Shift Templates
-- Date: 2026-04-04
-- Description: Removes org_shift_templates and related links as the system now uses House Shift templates/modes exclusively.

-- 1. Remove the foreign key column from staff_shifts
ALTER TABLE public.staff_shifts DROP COLUMN IF EXISTS org_shift_template_id;

-- 2. Drop the linking table
DROP TABLE IF EXISTS public.org_shift_template_checklists CASCADE;

-- 3. Drop the master templates table
DROP TABLE IF EXISTS public.org_shift_templates CASCADE;


-- FILE: 2026040700_rename_shift_types_to_templates.sql

-- ======================================================================================
-- Migration: Rename house_shift_types to house_shift_templates
-- Description: Renames the dynamic shift model tables and their foreign keys globally.
-- ======================================================================================

-- 1. Rename the main table and its primary key index
DROP TABLE IF EXISTS public.house_shift_templates CASCADE;
ALTER TABLE public.house_shift_types RENAME TO house_shift_templates;
ALTER INDEX IF EXISTS house_shift_types_pkey RENAME TO house_shift_templates_pkey;

-- Rename policies for the main table
ALTER POLICY "Allow authenticated to view house_shift_types" ON public.house_shift_templates RENAME TO "Allow authenticated to view house_shift_templates";
ALTER POLICY "Allow authenticated to manage house_shift_types" ON public.house_shift_templates RENAME TO "Allow authenticated to manage house_shift_templates";

-- 2. Rename the junction table
ALTER TABLE public.shift_type_default_checklists RENAME TO shift_template_default_checklists;

-- 3. Rename columns across all child tables referencing the shift model
ALTER TABLE public.shift_template_default_checklists RENAME COLUMN shift_type_id TO shift_template_id;
ALTER TABLE public.staff_shifts RENAME COLUMN shift_type_id TO shift_template_id;
ALTER TABLE public.house_checklist_submissions RENAME COLUMN shift_type_id TO shift_template_id;
ALTER TABLE public.shift_assigned_checklists RENAME COLUMN shift_type_id TO shift_template_id;

-- 4. Rename the string text column on staff_shifts
ALTER TABLE public.staff_shifts RENAME COLUMN shift_type TO shift_template;

-- 5. Update metadata comments
COMMENT ON TABLE public.house_shift_templates IS 'Defines house-specific shift periods for task grouping.';
COMMENT ON COLUMN public.staff_shifts.shift_template_id IS 'Link to the dynamic shift model for icons and colors.';
COMMENT ON COLUMN public.shift_assigned_checklists.shift_template_id IS 'Links the routine to a dynamic house shift template (Morning, Night, etc).';
COMMENT ON COLUMN public.staff_shifts.shift_template IS 'String representation of the shift template name.';


-- FILE: 2026040800_refactor_house_calendar_events.sql

-- Migration: Refactor house_calendar_events to use Junction Tables
-- Description: Removes type, target_shift, and notes. Replaces single/array assignments with proper many-to-many junction tables.

-- 1. Create Junction Tables
CREATE TABLE IF NOT EXISTS public.house_calendar_event_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.house_calendar_events(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, participant_id)
);

CREATE TABLE IF NOT EXISTS public.house_calendar_event_staff (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.house_calendar_events(id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, staff_id)
);

-- 2. Migrate existing single-column data (if migration hasn't run yet)
-- Note: We check if the columns still exist before trying to migrate
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='house_calendar_events' AND column_name='participant_id') THEN
        INSERT INTO public.house_calendar_event_participants (event_id, participant_id)
        SELECT id, participant_id FROM public.house_calendar_events WHERE participant_id IS NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='house_calendar_events' AND column_name='assigned_staff_id') THEN
        INSERT INTO public.house_calendar_event_staff (event_id, staff_id)
        SELECT id, assigned_staff_id FROM public.house_calendar_events WHERE assigned_staff_id IS NOT NULL;
    END IF;
END $$;

-- 3. Drop old columns and redundant fields
ALTER TABLE public.house_calendar_events 
DROP COLUMN IF EXISTS participant_id CASCADE,
DROP COLUMN IF EXISTS assigned_staff_id CASCADE,
DROP COLUMN IF EXISTS participant_ids CASCADE, -- Clean up previous array attempt if it existed
DROP COLUMN IF EXISTS assigned_staff_ids CASCADE, -- Clean up previous array attempt if it existed
DROP COLUMN IF EXISTS type CASCADE,
DROP COLUMN IF EXISTS target_shift CASCADE,
DROP COLUMN IF EXISTS notes CASCADE;

-- 4. Enable RLS on new tables
ALTER TABLE public.house_calendar_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_staff ENABLE ROW LEVEL SECURITY;

-- 5. Add basic RLS policies (assuming public read/authenticated write based on app patterns)
-- These should be refined based on the project's specific RLS strategies found in other migrations
CREATE POLICY "Allow authenticated select on event_participants" ON public.house_calendar_event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on event_participants" ON public.house_calendar_event_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on event_participants" ON public.house_calendar_event_participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on event_participants" ON public.house_calendar_event_participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on event_staff" ON public.house_calendar_event_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on event_staff" ON public.house_calendar_event_staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on event_staff" ON public.house_calendar_event_staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on event_staff" ON public.house_calendar_event_staff FOR DELETE TO authenticated USING (true);


-- FILE: 2026040801_add_checklist_item_attribution.sql

-- Migration: Add attribution and status to checklist submission items
-- Description: Adds completed_by and status columns to track which staff member completed each item.

-- 1. Add columns
ALTER TABLE public.house_checklist_submission_items 
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';

-- 2. Backfill status from is_completed
UPDATE public.house_checklist_submission_items 
SET status = 'Completed' 
WHERE is_completed = true AND (status = 'Pending' OR status IS NULL);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.house_checklist_submission_items.completed_by IS 'The staff member who completed this specific checklist item.';
COMMENT ON COLUMN public.house_checklist_submission_items.status IS 'The current status of this item (e.g., Pending, Completed).';


-- FILE: 2026040900_fix_checklist_progress_upsert.sql

-- Migration: Fix Checklist Progress Saving
-- Description: Adds a unique constraint to house_checklist_submission_items to enable UPSERT functionality.
-- Without this, checklist progress cannot be updated, only inserted as duplicates.
delete from public.house_checklist_submission_items;

ALTER TABLE public.house_checklist_submission_items 
ADD CONSTRAINT house_checklist_submission_items_submission_item_unique 
UNIQUE (submission_id, item_id);


-- FILE: 2026040901_shift_participants_rls.sql

-- Migration: Add RLS policies for shift_participants
-- Description: Standard staff members need access to the shift_participants junction table to view and manage participants on shifts.

ALTER TABLE public.shift_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins full access" ON public.shift_participants;

CREATE POLICY "Allow all users to view shift_participants"
  ON public.shift_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all users to insert shift_participants"
  ON public.shift_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to delete shift_participants"
  ON public.shift_participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow all users to update shift_participants"
  ON public.shift_participants FOR UPDATE TO authenticated USING (true);


-- FILE: 2026051100_granular_admin_roles.sql

-- ========================================================================================
-- GRANULAR ADMIN ROLES 2026-05-11
-- Objective: Transition from binary is_admin to tiered roles:
-- 1. Management/Director: Full System Access (CRUD)
-- 2. Finance: Read-Only Access (Global)
-- 3. Supervisor: Read-Only Access (Global) + House Profile Management (CRUD)
-- ========================================================================================

-- 1. ENSURE UNIQUE ROLE NAMES
ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);

-- 2. SEED ADMIN ROLES
INSERT INTO public.roles (name, description, is_active)
VALUES 
  ('Management', 'Full administrative access to all system features.', true),
  ('Director', 'Executive level access with full system control.', true),
  ('Finance', 'Read-only access to all records for financial auditing.', true),
  ('Supervisor', 'Global read access with ability to manage house profiles.', true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 3. DROP LEGACY ADMIN POLICIES
-- We remove the blanket "is_admin" policies to replace them with role-aware versions.
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Public schema policies
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND policyname = 'Admins full access') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
    
    -- Storage schema policies
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Admins full storage access') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 4. APPLY GRANULAR ADMIN POLICIES
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Tier 1: Management / Director / Super-Admin (is_admin = true)
        -- Full CRUD access to everything.
        EXECUTE format('CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated 
          USING (
            (auth.jwt() -> ''user_metadata'' ->> ''is_admin'')::boolean = true OR 
            (auth.jwt() -> ''user_metadata'' ->> ''role_name'') IN (''Management'', ''Director'')
          )', t.tablename);

        -- Tier 2: Finance / Supervisor
        -- Global Read access to everything.
        EXECUTE format('CREATE POLICY "Admins read-only access" ON public.%I FOR SELECT TO authenticated 
          USING (
            (auth.jwt() -> ''user_metadata'' ->> ''role_name'') IN (''Finance'', ''Supervisor'')
          )', t.tablename);
    END LOOP;
END $$;

-- 5. SPECIFIC SUPERVISOR HOUSE ACCESS
-- Supervisors have full control (CRUD) over houses, even though they are read-only elsewhere.
-- Note: SELECT is already covered by the global read-only policy above.
CREATE POLICY "Supervisors can manage houses" ON public.houses 
  FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role_name') = 'Supervisor')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role_name') = 'Supervisor');

-- 6. STORAGE SECURITY UPDATES
CREATE POLICY "Admins full storage access" ON storage.objects FOR ALL TO authenticated 
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
    (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Management', 'Director')
  );

CREATE POLICY "Admins read-only storage access" ON storage.objects FOR SELECT TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Finance', 'Supervisor'));

-- 7. AUTOMATIC ROLE SYNC TO JWT METADATA
-- This function ensures that when a staff member's role is updated in the database,
-- their secure JWT metadata is automatically updated to reflect the change.
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  -- Look up the name of the new role
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  -- Update the auth.users metadata if the staff record is linked to an auth user
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role_name', v_role_name)
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_staff_role_to_metadata ON public.staff;
CREATE TRIGGER trigger_sync_staff_role_to_metadata
AFTER INSERT OR UPDATE OF role_id ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.sync_staff_role_to_metadata();


-- FILE: 2026051300_normalized_rbac_system.sql

-- ========================================================================================
-- NORMALIZED RBAC SYSTEM 2026-05-13
-- Objective: Implement granular, column-based role permissions with 4 access levels.
-- ========================================================================================

-- 1. ENSURE UNIQUE ROLE NAMES (Prerequisite for ON CONFLICT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'roles_name_key' 
        AND conrelid = 'public.roles'::regclass
    ) THEN
        ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
    END IF;
END $$;

-- 2. CREATE ACCESS LEVEL ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_enum') THEN
        CREATE TYPE public.access_level_enum AS ENUM ('full', 'context_locked', 'read_only', 'none');
    END IF;
END $$;

-- 3. CREATE ROLE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID PRIMARY KEY REFERENCES public.roles(id) ON DELETE CASCADE,
    participant_profiles public.access_level_enum NOT NULL DEFAULT 'none',
    participant_notes public.access_level_enum NOT NULL DEFAULT 'none',
    house_profiles public.access_level_enum NOT NULL DEFAULT 'none',
    roster_board public.access_level_enum NOT NULL DEFAULT 'none',
    assign_staff_to_shift public.access_level_enum NOT NULL DEFAULT 'none',
    timesheets_submit public.access_level_enum NOT NULL DEFAULT 'none',
    timesheets_approve public.access_level_enum NOT NULL DEFAULT 'none',
    house_checklists public.access_level_enum NOT NULL DEFAULT 'none',
    shift_routines public.access_level_enum NOT NULL DEFAULT 'none',
    documents public.access_level_enum NOT NULL DEFAULT 'none',
    leave_requests public.access_level_enum NOT NULL DEFAULT 'none',
    master_lists public.access_level_enum NOT NULL DEFAULT 'none',
    activity_log public.access_level_enum NOT NULL DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only Admins (Management/Director) can manage permissions
-- Check if policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'role_permissions' 
        AND policyname = 'Admins manage role permissions'
    ) THEN
        CREATE POLICY "Admins manage role permissions" ON public.role_permissions
            FOR ALL TO authenticated
            USING (
                (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
                (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Management', 'Director', 'Admin')
            );
    END IF;
END $$;

-- 4. SEED INITIAL ROLES AND PERMISSIONS
-- Ensure we have the canonical role set
INSERT INTO public.roles (name, description, is_active)
VALUES 
  ('Admin', 'Global administrator with full system control.', true),
  ('Supervisor', 'Roster and house management for assigned locations.', true),
  ('Finance Manager', 'Payroll and financial data access.', true),
  ('House Manager', 'Operational control over specific houses.', true),
  ('Support Worker', 'Direct care delivery and reporting.', true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Ensure all existing roles have a default record in role_permissions
INSERT INTO public.role_permissions (role_id)
SELECT id FROM public.roles
ON CONFLICT (role_id) DO NOTHING;

-- Populate permissions for these roles
DO $$
DECLARE
    r_admin_id UUID;
    r_supervisor_id UUID;
    r_finance_id UUID;
    r_house_manager_id UUID;
    r_support_worker_id UUID;
BEGIN
    SELECT id INTO r_admin_id FROM public.roles WHERE name = 'Admin';
    SELECT id INTO r_supervisor_id FROM public.roles WHERE name = 'Supervisor';
    SELECT id INTO r_finance_id FROM public.roles WHERE name = 'Finance Manager';
    SELECT id INTO r_house_manager_id FROM public.roles WHERE name = 'House Manager';
    SELECT id INTO r_support_worker_id FROM public.roles WHERE name = 'Support Worker';

    -- Admin: Full Access to everything
    IF r_admin_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_admin_id, 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'full', participant_notes = 'full', house_profiles = 'full', roster_board = 'full', assign_staff_to_shift = 'full', timesheets_submit = 'full', timesheets_approve = 'full', house_checklists = 'full', shift_routines = 'full', documents = 'full', leave_requests = 'full', master_lists = 'full', activity_log = 'full';
    END IF;

    -- Supervisor: Roster/House control + Clinical Awareness
    IF r_supervisor_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_supervisor_id, 'context_locked', 'context_locked', 'context_locked', 'context_locked', 'full', 'read_only', 'context_locked', 'context_locked', 'full', 'context_locked', 'full', 'none', 'context_locked')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'context_locked', participant_notes = 'context_locked', house_profiles = 'context_locked', roster_board = 'context_locked', assign_staff_to_shift = 'full', timesheets_submit = 'read_only', timesheets_approve = 'context_locked', house_checklists = 'context_locked', shift_routines = 'full', documents = 'context_locked', leave_requests = 'full', master_lists = 'none', activity_log = 'context_locked';
    END IF;

    -- Finance Manager: Read-only global access to pay-relevant data
    IF r_finance_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_finance_id, 'none', 'none', 'none', 'none', 'none', 'none', 'full', 'none', 'none', 'read_only', 'none', 'none', 'read_only')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'none', participant_notes = 'none', house_profiles = 'none', roster_board = 'none', assign_staff_to_shift = 'none', timesheets_submit = 'none', timesheets_approve = 'full', house_checklists = 'none', shift_routines = 'none', documents = 'read_only', leave_requests = 'none', master_lists = 'none', activity_log = 'read_only';
    END IF;

    -- Support Worker: Personal shifts, limited clinical reporting
    IF r_support_worker_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, participant_profiles, participant_notes, house_profiles, roster_board, assign_staff_to_shift, timesheets_submit, timesheets_approve, house_checklists, shift_routines, documents, leave_requests, master_lists, activity_log)
        VALUES (r_support_worker_id, 'context_locked', 'context_locked', 'context_locked', 'read_only', 'none', 'full', 'none', 'context_locked', 'full', 'context_locked', 'full', 'none', 'read_only')
        ON CONFLICT (role_id) DO UPDATE SET 
          participant_profiles = 'context_locked', participant_notes = 'context_locked', house_profiles = 'context_locked', roster_board = 'read_only', assign_staff_to_shift = 'none', timesheets_submit = 'full', timesheets_approve = 'none', house_checklists = 'context_locked', shift_routines = 'full', documents = 'context_locked', leave_requests = 'full', master_lists = 'none', activity_log = 'read_only';
    END IF;
END $$;

-- 5. UPDATE SYNC FUNCTION TO INCLUDE PERMISSIONS IN JWT
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  -- Look up the name and permissions of the new role
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'participant_notes', participant_notes,
    'house_profiles', house_profiles,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'documents', documents,
    'leave_requests', leave_requests,
    'master_lists', master_lists,
    'activity_log', activity_log
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  -- Update the auth.users metadata if the staff record is linked to an auth user
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PROPAGATE PERMISSION CHANGES
-- Helper to sync a specific staff member
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'participant_notes', participant_notes,
    'house_profiles', house_profiles,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'documents', documents,
    'leave_requests', leave_requests,
    'master_lists', master_lists,
    'activity_log', activity_log
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.propagate_role_permission_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_record RECORD;
BEGIN
  FOR v_staff_record IN 
    SELECT id FROM public.staff WHERE role_id = NEW.role_id AND auth_user_id IS NOT NULL
  LOOP
    PERFORM public.sync_staff_role_to_metadata_for_staff(v_staff_record.id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_propagate_role_permission_changes ON public.role_permissions;
CREATE TRIGGER trigger_propagate_role_permission_changes
AFTER UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.propagate_role_permission_changes();


-- FILE: 2026051301_refine_rbac_modules.sql

-- ========================================================================================
-- REFINE RBAC MODULES 2026-05-13
-- Objective: Rename, drop, and add columns to role_permissions for precision.
-- ========================================================================================

-- 1. ALTER ROLE_PERMISSIONS TABLE
ALTER TABLE public.role_permissions 
    RENAME COLUMN participant_notes TO shift_notes;

ALTER TABLE public.role_permissions 
    DROP COLUMN master_lists,
    DROP COLUMN activity_log,
    DROP COLUMN documents;

ALTER TABLE public.role_permissions 
    ADD COLUMN staff_profiles public.access_level_enum NOT NULL DEFAULT 'none',
    ADD COLUMN participant_documents public.access_level_enum NOT NULL DEFAULT 'none',
    ADD COLUMN house_documents public.access_level_enum NOT NULL DEFAULT 'none',
    ADD COLUMN staff_documents public.access_level_enum NOT NULL DEFAULT 'none';

-- 2. UPDATE SYNC FUNCTIONS
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'staff_profiles', staff_profiles,
    'house_profiles', house_profiles,
    'shift_notes', shift_notes,
    'participant_documents', participant_documents,
    'house_documents', house_documents,
    'staff_documents', staff_documents,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'leave_requests', leave_requests
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'staff_profiles', staff_profiles,
    'house_profiles', house_profiles,
    'shift_notes', shift_notes,
    'participant_documents', participant_documents,
    'house_documents', house_documents,
    'staff_documents', staff_documents,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'leave_requests', leave_requests
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-SYNC ALL STAFF (Fires triggers to update JWTs with new schema)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.staff WHERE auth_user_id IS NOT NULL LOOP
        PERFORM public.sync_staff_role_to_metadata_for_staff(r.id);
    END LOOP;
END $$;


-- FILE: 2026051302_rbac_hardening.sql

-- ========================================================================================
-- RBAC HARDENING 2026-05-13
-- Objective: Automate permission record creation and handle role deletions.
-- ========================================================================================

-- 1. AUTOMATIC PERMISSION RECORD CREATION
-- This trigger ensures that every new role created automatically gets a 
-- default record in the role_permissions table (defaulting to 'none').
CREATE OR REPLACE FUNCTION public.handle_new_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.role_permissions (role_id)
    VALUES (NEW.id)
    ON CONFLICT (role_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_new_role_permissions ON public.roles;
CREATE TRIGGER trigger_handle_new_role_permissions
AFTER INSERT ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_role_permissions();

-- 2. ENSURE CONSISTENT ROLE CLEANUP
-- This ensures that if a role is deleted, we update the metadata of any staff
-- who were previously assigned to it (though FK constraints might block deletion if staff exist).
CREATE OR REPLACE FUNCTION public.handle_role_deletion_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- We don't delete staff, we just clear their metadata or re-sync
  FOR v_staff_id IN SELECT id FROM public.staff WHERE role_id = OLD.id LOOP
    -- Re-syncing will now find no role and thus no permissions
    PERFORM public.sync_staff_role_to_metadata_for_staff(v_staff_id);
  END LOOP;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_role_deletion_sync ON public.roles;
CREATE TRIGGER trigger_handle_role_deletion_sync
BEFORE DELETE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_role_deletion_sync();

-- 3. ENSURE ALL ROLES CURRENTLY HAVE PERMISSION RECORDS
INSERT INTO public.role_permissions (role_id)
SELECT id FROM public.roles
ON CONFLICT (role_id) DO NOTHING;


-- FILE: 2026051401_harden_rls_with_rbac.sql

-- ========================================================================================
-- RBAC RLS HARDENING 2026-05-14
-- Objective: Enforce context_locked permissions at the database level using JWT metadata.
-- ========================================================================================

-- 0. SCHEMA ADJUSTMENTS
-- (No schema adjustments required as timesheets/leave are managed via reporting lines)

-- 1. HELPERS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
         (auth.jwt() -> 'user_metadata' ->> 'role_name') IN ('Management', 'Director', 'Admin');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name)::public.access_level_enum,
    'none'::public.access_level_enum
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
  SELECT id FROM public.staff WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 2. CLEANUP OLD POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'houses', 'participants', 'staff', 'staff_shifts', 'shift_notes', 
            'timesheets', 'leave_requests', 'house_staff_assignments',
            'participant_medications', 'participant_notes', 'participant_goals',
            'participant_goal_progress', 'participant_hygiene_routines',
            'participant_contacts', 'participant_restrictive_practices',
            'house_checklists', 'house_checklist_items', 'house_checklist_submissions',
            'house_checklist_submission_items', 'house_checklist_item_attachments',
            'house_calendar_events', 'checklist_schedules'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. HOUSES POLICIES
CREATE POLICY "RBAC Houses SELECT" ON public.houses
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_profiles') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id() 
            AND hsa.house_id = public.houses.id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full'
);

-- 4. PARTICIPANTS POLICIES
CREATE POLICY "RBAC Participants SELECT" ON public.participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id() 
            AND hsa.house_id = public.participants.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC Participants ALL (Admin/Full)" ON public.participants
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
);

-- 5. STAFF POLICIES
CREATE POLICY "RBAC Staff SELECT" ON public.staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        EXISTS (
            -- Staff can see other staff assigned to the same houses OR their direct reports
            SELECT 1 FROM public.house_staff_assignments hsa1
            JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
            WHERE hsa1.staff_id = public.get_my_staff_id()
            AND hsa2.staff_id = public.staff.id
            AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
            AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
        ) OR
        public.staff.manager_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Staff ALL (Admin/Full)" ON public.staff
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
);

-- 6. SHIFTS POLICIES (Roster Board)
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('roster_board') = 'context_locked' AND
        (
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa
                WHERE hsa.staff_id = public.get_my_staff_id()
                AND hsa.house_id = public.staff_shifts.house_id
                AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
            ) OR
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.staff_shifts.staff_id
                AND s.manager_id = public.get_my_staff_id()
            )
        )
    )
);

CREATE POLICY "RBAC Shifts ALL (Admin/Full)" ON public.staff_shifts
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full'
);

-- 7. TIMESHEETS POLICIES
-- Managerial line enforcement
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE s.id = public.timesheets.staff_id
            AND s.manager_id = public.get_my_staff_id()
        )
    )
);

CREATE POLICY "RBAC Timesheets INSERT (Submit)" ON public.timesheets
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('timesheets_submit') IN ('full', 'context_locked') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'draft') OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE s.id = public.timesheets.staff_id
            AND s.manager_id = public.get_my_staff_id()
        )
    )
);

-- 8. LEAVE REQUESTS POLICIES
-- Managerial line enforcement
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('leave_requests') = 'context_locked' AND
        EXISTS (
            -- Managers can see leave for their direct reports
            SELECT 1 FROM public.staff s
            WHERE s.id = public.leave_requests.staff_id
            AND s.manager_id = public.get_my_staff_id()
        )
    )
);

CREATE POLICY "RBAC Leave ALL (Own/Admin/Full)" ON public.leave_requests
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') = 'full' OR
    staff_id = public.get_my_staff_id()
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('leave_requests') = 'full' OR
    staff_id = public.get_my_staff_id()
);

-- 9. PARTICIPANT CHILD ENTITIES (Clinical Awareness)
-- These inherit from participant_profiles level
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES 
        ('participant_medications'), ('participant_notes'), ('participant_goals'),
        ('participant_goal_progress'), ('participant_hygiene_routines'),
        ('participant_contacts'), ('participant_restrictive_practices')
    LOOP
        -- Special handling for goal_progress which links via goal_id
        IF t = 'participant_goal_progress' THEN
            v_join_clause := 'JOIN public.participant_goals pg ON pg.id = public.participant_goal_progress.goal_id JOIN public.participants p ON p.id = pg.participant_id';
        ELSE
            v_join_clause := 'JOIN public.participants p ON p.id = public.' || t || '.participant_id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') IN (''full'', ''read_only'') OR
                (
                    public.get_access_level(''participant_profiles'') = ''context_locked'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = p.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);
        
        EXECUTE format('
            CREATE POLICY "RBAC %I ALL (Admin/Full)" ON public.%I FOR ALL TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full''
            )
            WITH CHECK (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full''
            );
        ', t, t);
    END LOOP;
END $$;

-- 10. OPERATIONAL TABLES (Checklists & Routines)
-- House Checklists
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_checklists') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_checklists.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

-- House Checklist Submissions (Context locked to house assignments)
CREATE POLICY "RBAC Checklist Submissions SELECT" ON public.house_checklist_submissions
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    public.get_access_level('shift_routines') IN ('full', 'read_only') OR
    (
        (public.get_access_level('house_checklists') = 'context_locked' OR public.get_access_level('shift_routines') = 'context_locked') AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_checklist_submissions.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

-- House Staff Assignments
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        (
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa
                WHERE hsa.staff_id = public.get_my_staff_id()
                AND hsa.house_id = public.house_staff_assignments.house_id
                AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
            ) OR
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.house_staff_assignments.staff_id
                AND s.manager_id = public.get_my_staff_id()
            )
        )
    )
);

-- Shift Notes
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_locked' AND
        (
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa
                WHERE hsa.staff_id = public.get_my_staff_id()
                AND hsa.house_id = public.shift_notes.house_id
                AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
            ) OR
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.shift_notes.staff_id
                AND s.manager_id = public.get_my_staff_id()
            )
        )
    )
);

-- Child operational tables (items, submission items, etc.) - Simplified to broad read if submission is visible
CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Submission Items SELECT" ON public.house_checklist_submission_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Item Attachments SELECT" ON public.house_checklist_item_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Checklist Item Attachments INSERT" ON public.house_checklist_item_attachments FOR INSERT TO authenticated WITH CHECK (true);


-- FILE: 2026051402_rbac_documents_audit.sql

-- ========================================================================================
-- RBAC DOCUMENTS & COMPLIANCE AUDIT 2026-05-14
-- Objective: Secure documents, compliance, and secondary house tables identified in audit.
-- ========================================================================================

-- 1. CLEANUP OLD POLICIES FOR THESE TABLES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'participant_documents', 'participant_funding', 'house_files', 
            'staff_documents', 'staff_compliance', 'staff_training',
            'house_forms', 'house_form_assignments', 'house_form_submissions'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 2. PARTICIPANT DOCUMENTS (Context: House Assignment)
CREATE POLICY "RBAC Participant Documents SELECT" ON public.participant_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_documents') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            JOIN public.house_staff_assignments hsa ON hsa.house_id = p.house_id
            WHERE p.id = public.participant_documents.participant_id
            AND hsa.staff_id = public.get_my_staff_id()
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC Participant Documents ALL (Admin/Full)" ON public.participant_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full'
);

-- 3. HOUSE FILES (Context: House Assignment)
CREATE POLICY "RBAC House Files SELECT" ON public.house_files
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_documents') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_files.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

CREATE POLICY "RBAC House Files ALL (Admin/Full)" ON public.house_files
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_documents') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_documents') = 'full'
);

-- 4. STAFF DOCUMENTS (Context: Managerial Line or House Assignment)
CREATE POLICY "RBAC Staff Documents SELECT" ON public.staff_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_documents') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_documents') = 'context_locked' AND
        (
            -- Managers can see their reports' documents
            EXISTS (
                SELECT 1 FROM public.staff s
                WHERE s.id = public.staff_documents.staff_id
                AND s.manager_id = public.get_my_staff_id()
            ) OR
            -- Staff assigned to same house can see documents (if not restricted)
            EXISTS (
                SELECT 1 FROM public.house_staff_assignments hsa1
                JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
                WHERE hsa1.staff_id = public.get_my_staff_id()
                AND hsa2.staff_id = public.staff_documents.staff_id
                AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
                AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
            )
        )
    )
);

CREATE POLICY "RBAC Staff Documents ALL (Admin/Full)" ON public.staff_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_documents') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_documents') = 'full'
);

-- 5. STAFF COMPLIANCE & TRAINING (Inherit from staff_profiles)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN VALUES ('staff_compliance'), ('staff_training') LOOP
        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''staff_profiles'') IN (''full'', ''read_only'') OR
                staff_id = public.get_my_staff_id() OR
                (
                    public.get_access_level(''staff_profiles'') = ''context_locked'' AND
                    EXISTS (
                        SELECT 1 FROM public.staff s
                        WHERE s.id = public.%I.staff_id
                        AND s.manager_id = public.get_my_staff_id()
                    )
                )
            );
        ', t, t, t);
    END LOOP;
END $$;

-- 6. PARTICIPANT FUNDING (Inherit from participant_profiles)
CREATE POLICY "RBAC Participant Funding SELECT" ON public.participant_funding
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            JOIN public.house_staff_assignments hsa ON hsa.house_id = p.house_id
            WHERE p.id = public.participant_funding.participant_id
            AND hsa.staff_id = public.get_my_staff_id()
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);

-- 7. HOUSE FORMS & SUBMISSIONS (Inherit from house_checklists)
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES ('house_forms'), ('house_form_assignments'), ('house_form_submissions') LOOP
        -- Special handling for child tables that link via form_id
        IF t IN ('house_form_assignments', 'house_form_submissions') THEN
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.form_id';
        ELSE
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') IN (''full'', ''read_only'') OR
                (
                    public.get_access_level(''house_checklists'') = ''context_locked'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);
    END LOOP;
END $$;


-- FILE: 2026051403_rbac_peer_review_corrections.sql

-- ========================================================================================
-- RBAC PEER REVIEW CORRECTIONS 2026-05-14
-- Objective: Optimize RLS performance and fix edge cases identified in peer review.
-- ========================================================================================

-- 1. ENHANCE SYNC FUNCTIONS (Performance Optimization)
-- Including staff_id in metadata avoids a join to public.staff in every RLS check.
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  -- Look up the name and permissions of the role
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'staff_profiles', staff_profiles,
    'house_profiles', house_profiles,
    'shift_notes', shift_notes,
    'participant_documents', participant_documents,
    'house_documents', house_documents,
    'staff_documents', staff_documents,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'leave_requests', leave_requests
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  -- Update the auth.users metadata if the staff record is linked to an auth user
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'staff_id', NEW.id,
        'is_staff', true,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'participant_profiles', participant_profiles,
    'staff_profiles', staff_profiles,
    'house_profiles', house_profiles,
    'shift_notes', shift_notes,
    'participant_documents', participant_documents,
    'house_documents', house_documents,
    'staff_documents', staff_documents,
    'roster_board', roster_board,
    'assign_staff_to_shift', assign_staff_to_shift,
    'timesheets_submit', timesheets_submit,
    'timesheets_approve', timesheets_approve,
    'house_checklists', house_checklists,
    'shift_routines', shift_routines,
    'leave_requests', leave_requests
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'staff_id', v_staff_record.id,
        'is_staff', true,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RE-SYNC ALL STAFF (Populate staff_id and is_staff in JWTs)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.staff WHERE auth_user_id IS NOT NULL LOOP
        PERFORM public.sync_staff_role_to_metadata_for_staff(r.id);
    END LOOP;
END $$;

-- 3. OPTIMIZE RLS HELPERS
CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
  -- Prefer metadata for performance, fallback to table query for safety
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'staff_id')::uuid,
    (SELECT id FROM public.staff WHERE auth_user_id = auth.uid())
  );
$$ LANGUAGE sql STABLE;

-- 4. FIX EDGE CASE: GLOBAL CHECKLISTS
-- Ensure is_global column exists (discovered as missing in some environments)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'house_checklists' 
        AND column_name = 'is_global'
    ) THEN
        ALTER TABLE public.house_checklists ADD COLUMN is_global boolean DEFAULT false;
    END IF;
END $$;

-- Update House Checklists policy to allow read access to global checklists regardless of house assignment.
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    public.house_checklists.is_global = true OR
    (
        public.get_access_level('house_checklists') = 'context_locked' AND
        EXISTS (
            SELECT 1 FROM public.house_staff_assignments hsa
            WHERE hsa.staff_id = public.get_my_staff_id()
            AND hsa.house_id = public.house_checklists.house_id
            AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
        )
    )
);


-- FILE: 2026051404_rbac_recursion_fix.sql

-- ========================================================================================
-- RBAC RECURSION FIX 2026-05-14
-- Objective: Break infinite recursion in RLS by using SECURITY DEFINER helpers.
-- ========================================================================================

-- 1. SECURITY DEFINER HELPERS (Bypass RLS for context checks)
-- These functions run with the privileges of the DB owner, breaking the RLS dependency circle.

CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_house(p_staff_id UUID, p_house_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments
    WHERE staff_id = p_staff_id 
    AND house_id = p_house_id
    AND (end_date IS NULL OR end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff_managed_by(p_staff_id UUID, p_manager_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = p_staff_id AND manager_id = p_manager_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.do_staff_share_house(p_staff_id_1 UUID, p_staff_id_2 UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa1
    JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
    WHERE hsa1.staff_id = p_staff_id_1
    AND hsa2.staff_id = p_staff_id_2
    AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
    AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. RE-APPLY HARDENED POLICIES USING HELPERS

-- A. STAFF POLICIES
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        (
            public.do_staff_share_house(public.get_my_staff_id(), public.staff.id) OR
            public.is_staff_managed_by(public.staff.id, public.get_my_staff_id())
        )
    )
);

-- B. HOUSE STAFF ASSIGNMENTS
DROP POLICY IF EXISTS "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments;
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_profiles') = 'context_locked' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), public.house_staff_assignments.house_id) OR
            public.is_staff_managed_by(public.house_staff_assignments.staff_id, public.get_my_staff_id())
        )
    )
);

-- C. SHIFTS (Roster Board)
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('roster_board') = 'context_locked' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), public.staff_shifts.house_id) OR
            public.is_staff_managed_by(public.staff_shifts.staff_id, public.get_my_staff_id())
        )
    )
);

-- D. TIMESHEETS
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    )
);

DROP POLICY IF EXISTS "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'draft') OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    )
);

-- E. LEAVE REQUESTS
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('leave_requests') = 'context_locked' AND
        public.is_staff_managed_by(public.leave_requests.staff_id, public.get_my_staff_id())
    )
);

-- F. SHIFT NOTES
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_locked' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), public.shift_notes.house_id) OR
            public.is_staff_managed_by(public.shift_notes.staff_id, public.get_my_staff_id())
        )
    )
);


-- FILE: 2026051405_rbac_approval_hardening.sql

-- ========================================================================================
-- RBAC APPROVAL HARDENING 2026-05-14
-- Objective: Prevent staff from approving their own timesheets or leave requests.
-- ========================================================================================

-- 1. TIMESHEETS UPDATE HARDENING
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE (Approve/Edit)" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status IN ('draft', 'pending')) OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        public.get_access_level('timesheets_approve') = 'context_locked' AND
        public.is_staff_managed_by(public.timesheets.staff_id, public.get_my_staff_id())
    ) OR
    (
        -- Staff member updating their own record
        staff_id = public.get_my_staff_id() AND 
        status IN ('draft', 'pending') -- New status must still be draft or pending
    )
);

-- 2. LEAVE REQUESTS UPDATE HARDENING
DROP POLICY IF EXISTS "RBAC Leave ALL (Own/Admin/Full)" ON public.leave_requests;

-- Separate SELECT policy already exists, we just need to handle UPDATE/INSERT/DELETE

CREATE POLICY "RBAC Leave INSERT" ON public.leave_requests
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('leave_requests') IN ('full', 'context_locked') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Leave UPDATE" ON public.leave_requests
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending') OR
    public.is_staff_managed_by(public.leave_requests.staff_id, public.get_my_staff_id())
)
WITH CHECK (
    public.is_admin() OR
    public.is_staff_managed_by(public.leave_requests.staff_id, public.get_my_staff_id()) OR
    (
        -- Staff member updating their own record
        staff_id = public.get_my_staff_id() AND 
        status = 'pending' -- Cannot set to approved/rejected
    )
);

CREATE POLICY "RBAC Leave DELETE" ON public.leave_requests
FOR DELETE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending')
);


-- FILE: 2026051406_rbac_state_change_hardening.sql

-- ========================================================================================
-- RBAC STATE CHANGE HARDENING 2026-05-14
-- Objective: Prevent staff from modifying critical status columns (Medications, Compliance, Funding).
-- ========================================================================================

-- 1. STAFF PROFILE HARDENING
-- Staff should not be able to change their own status or role.
DROP POLICY IF EXISTS "RBAC Staff ALL (Admin/Full)" ON public.staff;
CREATE POLICY "RBAC Staff UPDATE" ON public.staff
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    auth_user_id = auth.uid() -- Allow self-update for contact info
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        auth_user_id = auth.uid() AND
        -- Block self-elevation or status changes
        (NEW.status = OLD.status) AND
        (NEW.role_id = OLD.role_id) AND
        (NEW.manager_id = OLD.manager_id)
    )
);

-- 2. PARTICIPANT HARDENING
-- Staff should not be able to change participant status (Active/Inactive)
DROP POLICY IF EXISTS "RBAC Participants ALL (Admin/Full)" ON public.participants;
CREATE POLICY "RBAC Participants UPDATE" ON public.participants
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), public.participants.house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        -- Context-locked staff can update notes etc, but not status
        public.get_access_level('participant_profiles') = 'context_locked' AND
        (NEW.status = OLD.status)
    )
);

-- 3. CLINICAL HARDENING (Medications)
-- Only Admins or Clinical Leads (Full Access) should toggle is_active on medications.
DROP POLICY IF EXISTS "RBAC participant_medications ALL (Admin/Full)" ON public.participant_medications;
CREATE POLICY "RBAC Medications ALL" ON public.participant_medications
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
);

-- 4. COMPLIANCE HARDENING
-- Staff MUST NOT update their own compliance records.
DROP POLICY IF EXISTS "RBAC staff_compliance SELECT" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance SELECT" ON public.staff_compliance
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    public.is_staff_managed_by(staff_id, public.get_my_staff_id())
);

CREATE POLICY "RBAC Staff Compliance ALL (Admin/Full)" ON public.staff_compliance
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full'
);

-- 5. FUNDING HARDENING
-- Only Admin/Full can manage funding levels.
DROP POLICY IF EXISTS "RBAC participant_funding SELECT" ON public.participant_funding;
CREATE POLICY "RBAC Participant Funding SELECT" ON public.participant_funding
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') = 'context_locked' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), 
            (SELECT house_id FROM public.participants WHERE id = public.participant_funding.participant_id)
        )
    )
);

DROP POLICY IF EXISTS "RBAC participant_funding ALL (Admin/Full)" ON public.participant_funding;
CREATE POLICY "RBAC Participant Funding ALL (Admin/Full)" ON public.participant_funding
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full'
);


-- FILE: 2026051500_secure_checklist_rls.sql

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


-- FILE: 2026051501_rbac_enhancement_unified.sql

-- ========================================================================================
-- ULTIMATE RBAC ENHANCEMENT: UNIFIED SCHEMA & POLICIES 2026-05-16 (FINAL REVISED)
-- Objective: Robustly rename 'context_locked' to 'context_read_write' and add 'context_read_only'.
-- This script integrates ALL hardening logic, recursion fixes, and approval constraints.
-- REVISION: Corrected PL/pgSQL loop syntax and join logic for clinical tables.
-- REVISION: Removed invalid NEW/OLD aliases from RLS policies.
-- ========================================================================================

BEGIN;

-- 1. DROP ALL EXISTING POLICIES ON SECURED TABLES
-- We must drop ALL policies (including legacy non-'RBAC' ones) on tables we are managing 
-- to prevent security leaks like self-approval of leave/timesheets.
DO $$
DECLARE
    r RECORD;
    v_tables text[] := ARRAY[
        'role_permissions', 'houses', 'participants', 'staff', 'staff_shifts', 
        'timesheets', 'leave_requests', 'participant_medications', 'participant_notes',
        'participant_goals', 'participant_goal_progress', 'participant_hygiene_routines',
        'participant_contacts', 'participant_restrictive_practices', 'participant_documents',
        'house_files', 'staff_documents', 'staff_compliance', 'staff_training', 
        'participant_funding', 'shift_notes', 'house_checklists', 'house_checklist_items',
        'house_checklist_submissions', 'house_checklist_submission_items', 
        'house_checklist_item_attachments', 'house_staff_assignments', 'house_forms',
        'house_form_assignments', 'house_form_submissions'
    ];
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = ANY(v_tables)
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 2. DROP DEPENDENT FUNCTIONS
DROP FUNCTION IF EXISTS public.get_access_level(text);
DROP FUNCTION IF EXISTS public.is_staff_assigned_to_house(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_staff_managed_by(uuid, uuid);
DROP FUNCTION IF EXISTS public.do_staff_share_house(uuid, uuid);

-- 3. CREATE NEW ENUM TYPE (Temporary)
-- This bypasses PostgreSQL's transaction limitations on modifying enum types.
CREATE TYPE public.access_level_enum_new AS ENUM ('full', 'context_read_write', 'context_read_only', 'read_only', 'none');

-- 4. CONVERT ROLE_PERMISSIONS COLUMNS
-- Map old 'context_locked' values to the new 'context_read_write'.
DO $$
DECLARE
    col_name TEXT;
    columns_to_convert TEXT[] := ARRAY[
        'participant_profiles', 'staff_profiles', 'house_profiles', 'shift_notes',
        'participant_documents', 'house_documents', 'staff_documents', 'roster_board',
        'assign_staff_to_shift', 'timesheets_submit', 'timesheets_approve',
        'house_checklists', 'shift_routines', 'leave_requests'
    ];
BEGIN
    FOREACH col_name IN ARRAY columns_to_convert LOOP
        EXECUTE format('ALTER TABLE public.role_permissions ALTER COLUMN %I DROP DEFAULT', col_name);
        EXECUTE format('
            ALTER TABLE public.role_permissions 
            ALTER COLUMN %I TYPE public.access_level_enum_new 
            USING (
                CASE 
                    WHEN %I::text = ''context_locked'' THEN ''context_read_write'' 
                    ELSE %I::text 
                END
            )::public.access_level_enum_new', col_name, col_name, col_name);
        EXECUTE format('ALTER TABLE public.role_permissions ALTER COLUMN %I SET DEFAULT ''none''::public.access_level_enum_new', col_name);
    END LOOP;
END $$;

-- 5. SWAP ENUM TYPES
DROP TYPE public.access_level_enum;
ALTER TYPE public.access_level_enum_new RENAME TO access_level_enum;

-- 6. RECREATE HELPERS
-- A. get_access_level: Core helper for extracting RBAC levels from JWT metadata.
CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_perm_text text;
BEGIN
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name;
  -- Transition shim
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql STABLE;

-- B. is_staff_assigned_to_house: SECURITY DEFINER helper to break RLS recursion.
CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_house(p_staff_id UUID, p_house_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments
    WHERE staff_id = p_staff_id AND house_id = p_house_id
    AND (end_date IS NULL OR end_date > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- C. is_staff_managed_by: SECURITY DEFINER helper for managerial line checks.
-- Hardened: Explicitly returns false if staff tries to manage themselves.
CREATE OR REPLACE FUNCTION public.is_staff_managed_by(p_staff_id UUID, p_manager_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = p_staff_id AND manager_id = p_manager_id
    AND p_staff_id != p_manager_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- D. do_staff_share_house: SECURITY DEFINER helper for peer-to-peer visibility.
CREATE OR REPLACE FUNCTION public.do_staff_share_house(p_staff_id_1 UUID, p_staff_id_2 UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_staff_assignments hsa1
    JOIN public.house_staff_assignments hsa2 ON hsa1.house_id = hsa2.house_id
    WHERE hsa1.staff_id = p_staff_id_1 AND hsa2.staff_id = p_staff_id_2
    AND (hsa1.end_date IS NULL OR hsa1.end_date > NOW())
    AND (hsa2.end_date IS NULL OR hsa2.end_date > NOW())
    AND p_staff_id_1 != p_staff_id_2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. RECREATE POLICIES (EXHAUSTIVE & HARDENED)

-- 7.0 ROLE PERMISSIONS
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
    FOR ALL TO authenticated
    USING (public.is_admin());

-- 7.1 HOUSES
CREATE POLICY "RBAC Houses SELECT" ON public.houses
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_profiles') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), id)
    )
);

CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('house_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('house_profiles') = 'full');

-- 7.2 PARTICIPANTS
CREATE POLICY "RBAC Participants SELECT" ON public.participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

CREATE POLICY "RBAC Participants UPDATE" ON public.participants
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- 7.3 STAFF
CREATE POLICY "RBAC Staff SELECT" ON public.staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('staff_profiles') IN ('context_read_write', 'context_read_only') AND
        (
            public.do_staff_share_house(public.get_my_staff_id(), id) OR
            public.is_staff_managed_by(id, public.get_my_staff_id())
        )
    )
);

CREATE POLICY "RBAC Staff UPDATE" ON public.staff
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    auth_user_id = auth.uid()
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    auth_user_id = auth.uid()
);

-- 7.4 STAFF SHIFTS (Roster Board)
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('roster_board') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

CREATE POLICY "RBAC Shifts ALL (Admin/Full)" ON public.staff_shifts
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('roster_board') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('roster_board') = 'full');

-- 7.5 TIMESHEETS
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('timesheets_approve') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

CREATE POLICY "RBAC Timesheets INSERT (Submit)" ON public.timesheets
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('timesheets_submit') IN ('full', 'context_read_write') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status IN ('draft', 'pending')) OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        -- Hardened: Block self-approval even if staff is their own manager
        public.get_access_level('timesheets_approve') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND
        staff_id != public.get_my_staff_id()
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('timesheets_approve') = 'full' OR
    (
        -- Hardened: Block self-approval
        public.get_access_level('timesheets_approve') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND
        staff_id != public.get_my_staff_id()
    ) OR
    (
        staff_id = public.get_my_staff_id() AND status IN ('draft', 'pending')
    )
);

-- 7.6 LEAVE REQUESTS
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('leave_requests') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('leave_requests') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

CREATE POLICY "RBAC Leave INSERT" ON public.leave_requests
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    (
        public.get_access_level('leave_requests') IN ('full', 'context_read_write') AND
        staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Leave UPDATE" ON public.leave_requests
FOR UPDATE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending') OR
    (
        -- Hardened: Block self-approval
        public.get_access_level('leave_requests') IN ('full', 'context_read_write') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND
        staff_id != public.get_my_staff_id()
    )
)
WITH CHECK (
    public.is_admin() OR
    (
        -- Hardened: Block self-approval
        public.get_access_level('leave_requests') IN ('full', 'context_read_write') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id()) AND
        staff_id != public.get_my_staff_id()
    ) OR
    (
        staff_id = public.get_my_staff_id() AND status = 'pending'
    )
);

CREATE POLICY "RBAC Leave DELETE" ON public.leave_requests
FOR DELETE TO authenticated
USING (
    public.is_admin() OR
    (staff_id = public.get_my_staff_id() AND status = 'pending')
);

-- 7.7 CLINICAL CHILD ENTITIES
DO $$
DECLARE
    t text;
    v_join_clause text;
    v_tables text[] := ARRAY[
        'participant_notes', 'participant_goals',
        'participant_goal_progress', 'participant_hygiene_routines',
        'participant_contacts', 'participant_restrictive_practices'
    ];
BEGIN
    FOREACH t IN ARRAY v_tables LOOP
        IF t = 'participant_goal_progress' THEN
            v_join_clause := 'JOIN public.participant_goals pg ON pg.id = public.participant_goal_progress.goal_id JOIN public.participants p ON p.id = pg.participant_id';
        ELSE
            v_join_clause := 'JOIN public.participants p ON p.id = public.' || t || '.participant_id';
        END IF;

        -- SELECT POLICY
        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') IN (''full'', ''read_only'') OR
                (
                    public.get_access_level(''participant_profiles'') IN (''context_read_write'', ''context_read_only'') AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = p.house_id AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);

        -- ALL POLICY (Context Read/Write)
        EXECUTE format('
            CREATE POLICY "RBAC %I ALL (Full/Context)" ON public.%I FOR ALL TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full'' OR
                (
                    public.get_access_level(''participant_profiles'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = p.house_id AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            )
            WITH CHECK (
                public.is_admin() OR
                public.get_access_level(''participant_profiles'') = ''full'' OR
                (
                    public.get_access_level(''participant_profiles'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = p.house_id AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause, v_join_clause);
    END LOOP;
END $$;

-- 7.7.1 Medications Hardening: Only Full access can manage lifecycle
CREATE POLICY "RBAC Medications SELECT" ON public.participant_medications
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') IN ('context_read_write', 'context_read_only') AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_medications.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

CREATE POLICY "RBAC Medications ALL" ON public.participant_medications
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('participant_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

-- 7.8 DOCUMENTS
CREATE POLICY "RBAC Participant Documents SELECT" ON public.participant_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_documents') IN ('context_read_write', 'context_read_only') AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_documents.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

CREATE POLICY "RBAC Participant Documents ALL" ON public.participant_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full' OR
    (
        public.get_access_level('participant_documents') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_documents.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_documents') = 'full' OR
    (
        public.get_access_level('participant_documents') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_documents.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

-- 7.9 COMPLIANCE & TRAINING
CREATE POLICY "RBAC Staff Compliance SELECT" ON public.staff_compliance
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    public.is_staff_managed_by(staff_id, public.get_my_staff_id())
);

CREATE POLICY "RBAC Staff Compliance ALL" ON public.staff_compliance
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('staff_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('staff_profiles') = 'full');

CREATE POLICY "RBAC Staff Training SELECT" ON public.staff_training
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    public.is_staff_managed_by(staff_id, public.get_my_staff_id())
);

CREATE POLICY "RBAC Staff Training ALL" ON public.staff_training
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- 7.10 FUNDING (Hardened: Admin/Full only for write)
CREATE POLICY "RBAC Participant Funding SELECT" ON public.participant_funding
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') IN ('full', 'read_only') OR
    (
        public.get_access_level('participant_profiles') IN ('context_read_write', 'context_read_only') AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_funding.participant_id AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

CREATE POLICY "RBAC Participant Funding ALL" ON public.participant_funding
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('participant_profiles') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

-- 7.11 SHIFT NOTES
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

CREATE POLICY "RBAC Shift Notes ALL" ON public.shift_notes
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_notes') = 'full' OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('shift_notes') = 'full' OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('shift_notes') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- 7.12 CHECKLISTS & ROUTINES (Hardened as of 2026-05-15)
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

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
                public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hc.house_id)
            )
        )
    )
);

CREATE POLICY "RBAC Checklist Submissions SELECT" ON public.house_checklist_submissions
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'read_only') OR
    public.get_access_level('shift_routines') IN ('full', 'read_only') OR
    (
        (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR 
         public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

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
                (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR 
                 public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
            )
        )
    )
);

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
                public.get_access_level('shift_routines') = 'context_read_write' AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
            )
        )
    )
);

-- 7.13 HOUSE STAFF ASSIGNMENTS (Crucial for visibility)
CREATE POLICY "RBAC House Staff Assignments SELECT" ON public.house_staff_assignments
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_profiles') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

-- 7.14 HOUSE FILES
CREATE POLICY "RBAC House Files SELECT" ON public.house_files
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_documents') IN ('full', 'read_only') OR
    (
        public.get_access_level('house_documents') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

CREATE POLICY "RBAC House Files ALL" ON public.house_files
FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('house_documents') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('house_documents') = 'full');

-- 7.15 STAFF DOCUMENTS
CREATE POLICY "RBAC Staff Documents SELECT" ON public.staff_documents
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_documents') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('staff_documents') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_managed_by(staff_id, public.get_my_staff_id()) OR
            public.do_staff_share_house(public.get_my_staff_id(), staff_id)
        )
    )
);

CREATE POLICY "RBAC Staff Documents ALL" ON public.staff_documents
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_documents') = 'full' OR
    staff_id = public.get_my_staff_id()
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_documents') = 'full' OR
    staff_id = public.get_my_staff_id()
);

-- 7.16 CHECKLIST ATTACHMENTS
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
                (public.get_access_level('house_checklists') IN ('context_read_write', 'context_read_only') OR 
                 public.get_access_level('shift_routines') IN ('context_read_write', 'context_read_only')) AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
            )
        )
    )
);

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
                public.get_access_level('shift_routines') = 'context_read_write' AND
                public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
            )
        )
    )
);

-- 7.17 HOUSE FORMS
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES ('house_forms'), ('house_form_assignments'), ('house_form_submissions') LOOP
        IF t = 'house_forms' THEN
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.house_forms.id';
        ELSE
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.form_id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') IN (''full'', ''read_only'') OR
                (
                    public.get_access_level(''house_checklists'') IN (''context_read_write'', ''context_read_only'') AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause);
    END LOOP;
END $$;

COMMIT;


-- FILE: 2026051502_comprehensive_rls_audit_fixes.sql

-- ========================================================================================
-- COMPREHENSIVE RLS AUDIT & FIXES 2026-05-17
-- Objective: Close security gaps in junction tables and unblock 'context_read_write' workflows.
-- ========================================================================================

BEGIN;

-- 1. DROP OVER-PERMISSIVE OR INCORRECT POLICIES
-- Identified in the May 15 audit.
DO $$
BEGIN
    -- Junction Tables (Over-permissive CRUD)
    DROP POLICY IF EXISTS "Allow all users to view shift_participants" ON public.shift_participants;
    DROP POLICY IF EXISTS "Allow all users to insert shift_participants" ON public.shift_participants;
    DROP POLICY IF EXISTS "Allow all users to update shift_participants" ON public.shift_participants;
    DROP POLICY IF EXISTS "Allow all users to delete shift_participants" ON public.shift_participants;

    DROP POLICY IF EXISTS "Allow authenticated select on event_participants" ON public.house_calendar_event_participants;
    DROP POLICY IF EXISTS "Allow authenticated insert on event_participants" ON public.house_calendar_event_participants;
    DROP POLICY IF EXISTS "Allow authenticated update on event_participants" ON public.house_calendar_event_participants;
    DROP POLICY IF EXISTS "Allow authenticated delete on event_participants" ON public.house_calendar_event_participants;

    DROP POLICY IF EXISTS "Allow authenticated select on event_staff" ON public.house_calendar_event_staff;
    DROP POLICY IF EXISTS "Allow authenticated insert on event_staff" ON public.house_calendar_event_staff;
    DROP POLICY IF EXISTS "Allow authenticated update on event_staff" ON public.house_calendar_event_staff;
    DROP POLICY IF EXISTS "Allow authenticated delete on event_staff" ON public.house_calendar_event_staff;

    -- Checklist Junction (Public grant)
    DROP POLICY IF EXISTS "Users can view shift assignments for their houses" ON public.shift_assigned_checklists;
    
    -- Activity Log (Privacy Leak)
    DROP POLICY IF EXISTS "Authenticated users select activity log" ON public.activity_log;

    -- Master Tables (Admins-only CRUD usually, but SELECT missing for some)
    -- We will re-add SELECT for all authenticated below.
END $$;

-- 2. PHASE 1: SECURE OVER-PERMISSIVE POLICIES (Security Risks)

-- 2.1 shift_participants (Locked to Roster context)
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') IN ('full', 'read_only') OR
    EXISTS (
        SELECT 1 FROM public.staff_shifts ss
        WHERE ss.id = public.shift_participants.shift_id
        AND (ss.staff_id = public.get_my_staff_id() OR public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id))
    )
);

CREATE POLICY "RBAC Shift Participants ALL (Admin/Full/Context)" ON public.shift_participants
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full' OR
    (
        public.get_access_level('roster_board') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.staff_shifts ss
            WHERE ss.id = public.shift_participants.shift_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id)
        )
    )
);

-- 2.2 house_calendar_event_participants (Locked to House Profiles context)
CREATE POLICY "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    EXISTS (
        SELECT 1 FROM public.house_calendar_events hce
        WHERE hce.id = public.house_calendar_event_participants.event_id
        AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
    ) OR
    EXISTS (
        -- Also visible if the staff is explicitly assigned to this specific event
        SELECT 1 FROM public.house_calendar_event_staff hces
        WHERE hces.event_id = public.house_calendar_event_participants.event_id
        AND hces.staff_id = public.get_my_staff_id()
    )
);

CREATE POLICY "RBAC Calendar Event Participants ALL (Admin/Full/Context)" ON public.house_calendar_event_participants
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full' OR
    (
        public.get_access_level('house_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.house_calendar_events hce
            WHERE hce.id = public.house_calendar_event_participants.event_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
        )
    )
);

-- 2.3 house_calendar_event_staff (Locked to House Profiles context)
CREATE POLICY "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    EXISTS (
        SELECT 1 FROM public.house_calendar_events hce
        WHERE hce.id = public.house_calendar_event_staff.event_id
        AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
    )
);

CREATE POLICY "RBAC Calendar Event Staff ALL (Admin/Full/Context)" ON public.house_calendar_event_staff
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_profiles') = 'full' OR
    (
        public.get_access_level('house_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.house_calendar_events hce
            WHERE hce.id = public.house_calendar_event_staff.event_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), hce.house_id)
        )
    )
);

-- 2.4 shift_assigned_checklists (Restricted to Authenticated + Context)
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('shift_routines') IN ('full', 'read_only') OR
    EXISTS (
        SELECT 1 FROM public.staff_shifts ss
        WHERE ss.id = public.shift_assigned_checklists.shift_id
        AND (ss.staff_id = public.get_my_staff_id() OR public.is_staff_assigned_to_house(public.get_my_staff_id(), ss.house_id))
    )
);

-- 2.5 activity_log (Limit to Admins/Full)
CREATE POLICY "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('activity_log') = 'full'
);

-- 3. PHASE 2: UNBLOCK 'context_read_write' MANAGERS (Workflow Blockers)

-- 3.1 staff_shifts (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Shifts ALL (Admin/Full)" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts ALL (Admin/Full/Context)" ON public.staff_shifts
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full' OR
    (
        public.get_access_level('roster_board') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('roster_board') = 'full' OR
    (
        public.get_access_level('roster_board') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- 3.2 participant_medications (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Medications ALL" ON public.participant_medications;
CREATE POLICY "RBAC Medications ALL (Admin/Full/Context)" ON public.participant_medications
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_medications.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_medications.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

-- 3.3 staff_compliance (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Staff Compliance ALL" ON public.staff_compliance;
CREATE POLICY "RBAC Staff Compliance ALL (Admin/Full/Context)" ON public.staff_compliance
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- 3.4 participant_funding (Allow context_read_write)
DROP POLICY IF EXISTS "RBAC Participant Funding ALL" ON public.participant_funding;
CREATE POLICY "RBAC Participant Funding ALL (Admin/Full/Context)" ON public.participant_funding
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_funding.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('participant_profiles') = 'full' OR
    (
        public.get_access_level('participant_profiles') = 'context_read_write' AND
        EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = public.participant_funding.participant_id
            AND public.is_staff_assigned_to_house(public.get_my_staff_id(), p.house_id)
        )
    )
);

-- 3.5 house_checklists (Add ALL for context_read_write)
CREATE POLICY "RBAC House Checklists ALL (Admin/Full/Context)" ON public.house_checklists
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('house_checklists') = 'full' OR
    (
        public.get_access_level('house_checklists') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_checklists') = 'full' OR
    (
        public.get_access_level('house_checklists') = 'context_read_write' AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- 3.6 house_staff_assignments (Add ALL for context_read_write)
CREATE POLICY "RBAC House Staff Assignments ALL (Admin/Full/Context)" ON public.house_staff_assignments
FOR ALL TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('staff_profiles') = 'full' OR
    (
        public.get_access_level('staff_profiles') = 'context_read_write' AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);


-- 4. PHASE 3: ADD MISSING CORE OPERATIONS (Functional Gaps)

-- 4.1 house_checklist_submissions (INSERT)
CREATE POLICY "RBAC Checklist Submissions INSERT" ON public.house_checklist_submissions
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    public.get_access_level('house_checklists') IN ('full', 'context_read_write') OR
    public.get_access_level('shift_routines') IN ('full', 'context_read_write') AND
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
);

-- 4.2 house_checklist_submission_items (INSERT)
CREATE POLICY "RBAC Checklist Submission Items INSERT" ON public.house_checklist_submission_items
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.house_checklist_submissions hcs
        WHERE hcs.id = public.house_checklist_submission_items.submission_id
        AND (
            public.get_access_level('shift_routines') IN ('full', 'context_read_write') AND
            public.is_staff_assigned_to_house(public.get_my_staff_id(), hcs.house_id)
        )
    )
);

-- 4.3 participants (INSERT/DELETE)
CREATE POLICY "RBAC Participants INSERT" ON public.participants
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

CREATE POLICY "RBAC Participants DELETE" ON public.participants
FOR DELETE TO authenticated
USING (public.is_admin() OR public.get_access_level('participant_profiles') = 'full');

-- 4.4 staff (INSERT/DELETE)
CREATE POLICY "RBAC Staff INSERT" ON public.staff
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR public.get_access_level('staff_profiles') = 'full');

CREATE POLICY "RBAC Staff DELETE" ON public.staff
FOR DELETE TO authenticated
USING (public.is_admin() OR public.get_access_level('staff_profiles') = 'full');

-- 4.5 House Forms (ALL)
-- Allowing managers to manage their own house forms.
DO $$
DECLARE
    t text;
    v_join_clause text;
BEGIN
    FOR t IN VALUES ('house_forms'), ('house_form_assignments'), ('house_form_submissions') LOOP
        IF t = 'house_forms' THEN
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.house_forms.id';
        ELSE
            v_join_clause := 'JOIN public.house_forms hf ON hf.id = public.' || t || '.form_id';
        END IF;

        EXECUTE format('
            CREATE POLICY "RBAC %I ALL (Admin/Full/Context)" ON public.%I FOR ALL TO authenticated
            USING (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') = ''full'' OR
                (
                    public.get_access_level(''house_checklists'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            )
            WITH CHECK (
                public.is_admin() OR
                public.get_access_level(''house_checklists'') = ''full'' OR
                (
                    public.get_access_level(''house_checklists'') = ''context_read_write'' AND
                    EXISTS (
                        SELECT 1 FROM public.house_staff_assignments hsa
                        %s
                        WHERE hsa.house_id = hf.house_id
                        AND hsa.staff_id = public.get_my_staff_id()
                        AND (hsa.end_date IS NULL OR hsa.end_date > NOW())
                    )
                )
            );
        ', t, t, v_join_clause, v_join_clause);
    END LOOP;
END $$;

-- 4.6 Master/Lookup Tables (SELECT for all staff, ALL for Master Lists permission)
-- Ensuring all essential master tables are readable for dropdowns.
DO $$
DECLARE
    t text;
    v_master_tables text[] := ARRAY[
        'contact_types_master', 'funding_sources_master', 'employment_types_master',
        'house_types_master', 'funding_types_master', 'branches', 'departments',
        'roles', 'medications_master', 'leave_types', 'house_calendar_event_types_master',
        'checklist_master', 'checklist_item_master'
    ];
BEGIN
    FOREACH t IN ARRAY v_master_tables LOOP
        -- SELECT POLICY
        EXECUTE format('DROP POLICY IF EXISTS "Staff select %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Staff select %I" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        
        -- ALL POLICY (Locked to master_lists permission)
        EXECUTE format('DROP POLICY IF EXISTS "RBAC %I ALL (Admin/Full)" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL (Admin/Full)" ON public.%I FOR ALL TO authenticated 
            USING (public.is_admin() OR public.get_access_level(''master_lists'') = ''full'')
            WITH CHECK (public.is_admin() OR public.get_access_level(''master_lists'') = ''full'')', t, t, t, t);
    END LOOP;
END $$;

COMMIT;


-- FILE: 2026051503_rename_rbac_permissions.sql

-- ========================================================================================
-- RENAME & EXPAND RBAC PERMISSIONS 2026-05-18 (FINAL REVISED)
-- Objective: Clarify terminology between Personal Workspace and Administrative Control.
-- Fixes: Trigger recursion, missing columns (master_lists, activity_log), and test consistency.
-- ========================================================================================

BEGIN;

-- 1. ENSURE ALL NEW COLUMNS EXIST
ALTER TABLE public.role_permissions 
ADD COLUMN IF NOT EXISTS my_roster public.access_level_enum NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS my_timesheets public.access_level_enum NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS my_leave public.access_level_enum NOT NULL DEFAULT 'full',
ADD COLUMN IF NOT EXISTS manage_staff public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_participants public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_houses public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_roster_board public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_timesheets public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_leave public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_role_permissions public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS manage_master_lists public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS view_activity_log public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS execute_house_checklists public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS execute_shift_routines public.access_level_enum NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS write_shift_notes public.access_level_enum NOT NULL DEFAULT 'none';

-- 2. UPDATE SYNC FUNCTIONS (Do BEFORE data migration to avoid trigger failures)

-- A. sync_staff_role_to_metadata (Trigger Function)
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'my_roster', my_roster,
    'my_timesheets', my_timesheets,
    'my_leave', my_leave,
    'manage_staff', manage_staff,
    'manage_participants', manage_participants,
    'manage_houses', manage_houses,
    'manage_roster_board', manage_roster_board,
    'manage_timesheets', manage_timesheets,
    'manage_leave', manage_leave,
    'manage_role_permissions', manage_role_permissions,
    'manage_master_lists', manage_master_lists,
    'view_activity_log', view_activity_log,
    'execute_house_checklists', execute_house_checklists,
    'execute_shift_routines', execute_shift_routines,
    'write_shift_notes', write_shift_notes
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. sync_staff_role_to_metadata_for_staff (Helper Function)
CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'my_roster', my_roster,
    'my_timesheets', my_timesheets,
    'my_leave', my_leave,
    'manage_staff', manage_staff,
    'manage_participants', manage_participants,
    'manage_houses', manage_houses,
    'manage_roster_board', manage_roster_board,
    'manage_timesheets', manage_timesheets,
    'manage_leave', manage_leave,
    'manage_role_permissions', manage_role_permissions,
    'manage_master_lists', manage_master_lists,
    'view_activity_log', view_activity_log,
    'execute_house_checklists', execute_house_checklists,
    'execute_shift_routines', execute_shift_routines,
    'write_shift_notes', write_shift_notes
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DATA MIGRATION
-- Robustly migrate data, handling possible missing columns in baseline.
DO $$
BEGIN
    UPDATE public.role_permissions SET
        manage_staff = COALESCE((SELECT staff_profiles FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_participants = COALESCE((SELECT participant_profiles FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_houses = COALESCE((SELECT house_profiles FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_roster_board = COALESCE((SELECT roster_board FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_timesheets = COALESCE((SELECT timesheets_approve FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_leave = COALESCE((SELECT leave_requests FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        execute_house_checklists = COALESCE((SELECT house_checklists FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        execute_shift_routines = COALESCE((SELECT shift_routines FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        write_shift_notes = COALESCE((SELECT shift_notes FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        manage_master_lists = COALESCE((SELECT master_lists FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none'),
        view_activity_log = COALESCE((SELECT activity_log FROM public.role_permissions rp2 WHERE rp2.role_id = public.role_permissions.role_id), 'none')
    WHERE true;
EXCEPTION WHEN OTHERS THEN
    -- Fallback for environments with different baselines
    NULL;
END $$;

-- 4. DROP OLD COLUMNS
ALTER TABLE public.role_permissions 
DROP COLUMN IF EXISTS staff_profiles,
DROP COLUMN IF EXISTS participant_profiles,
DROP COLUMN IF EXISTS house_profiles,
DROP COLUMN IF EXISTS roster_board,
DROP COLUMN IF EXISTS timesheets_approve,
DROP COLUMN IF EXISTS timesheets_submit,
DROP COLUMN IF EXISTS house_checklists,
DROP COLUMN IF EXISTS shift_routines,
DROP COLUMN IF EXISTS shift_notes,
DROP COLUMN IF EXISTS participant_notes,
DROP COLUMN IF EXISTS assign_staff_to_shift,
DROP COLUMN IF EXISTS documents,
DROP COLUMN IF EXISTS master_lists,
DROP COLUMN IF EXISTS activity_log,
DROP COLUMN IF EXISTS leave_requests;

-- 5. UPDATE RLS POLICIES TO USE NEW NAMES
-- Activity Log
DROP POLICY IF EXISTS "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log;
CREATE POLICY "RBAC Activity Log SELECT (Privacy Hardened)" ON public.activity_log
FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('view_activity_log') = 'full'
);

-- Houses
DROP POLICY IF EXISTS "RBAC Houses SELECT" ON public.houses;
CREATE POLICY "RBAC Houses SELECT" ON public.houses FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_houses') IN ('full', 'read_only') OR
    (
        public.get_access_level('manage_houses') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), id)
    )
);

DROP POLICY IF EXISTS "RBAC Houses ALL (Admin/Full)" ON public.houses;
CREATE POLICY "RBAC Houses ALL (Admin/Full)" ON public.houses FOR ALL TO authenticated
USING (public.is_admin() OR public.get_access_level('manage_houses') = 'full')
WITH CHECK (public.is_admin() OR public.get_access_level('manage_houses') = 'full');

-- Participants
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_participants') IN ('full', 'read_only') OR
    (
        public.get_access_level('manage_participants') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- Staff
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_staff') IN ('full', 'read_only') OR
    auth_user_id = auth.uid() OR
    (
        public.get_access_level('manage_staff') IN ('context_read_write', 'context_read_only') AND
        (
            public.do_staff_share_house(public.get_my_staff_id(), id) OR
            public.is_staff_managed_by(id, public.get_my_staff_id())
        )
    )
);

-- Roster Board
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_roster_board') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_timesheets') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- Leave
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('manage_leave') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('manage_leave') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_managed_by(staff_id, public.get_my_staff_id())
    )
);

-- Operational: Checklists
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('execute_house_checklists') IN ('full', 'read_only') OR
    (
        public.get_access_level('execute_house_checklists') IN ('context_read_write', 'context_read_only') AND
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
);

-- Operational: Shift Notes
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes FOR SELECT TO authenticated
USING (
    public.is_admin() OR
    public.get_access_level('write_shift_notes') IN ('full', 'read_only') OR
    staff_id = public.get_my_staff_id() OR
    (
        public.get_access_level('write_shift_notes') IN ('context_read_write', 'context_read_only') AND
        (
            public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) OR
            public.is_staff_managed_by(staff_id, public.get_my_staff_id())
        )
    )
);

-- 6. RE-SEED DEFAULT ROLES FOR PERSONAL WORKSPACE
UPDATE public.role_permissions SET 
    my_roster = 'full', 
    my_timesheets = 'full', 
    my_leave = 'full'
WHERE true;

-- Special Case: Admin roles get full access to RBAC management and Master Data
UPDATE public.role_permissions SET 
    manage_role_permissions = 'full',
    manage_master_lists = 'full',
    view_activity_log = 'full'
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('Admin', 'Director', 'Management'));

COMMIT;


-- FILE: 2026051600_fix_rbac_gaps.sql

-- Migration: Fix RBAC Gaps
-- Description: Adds missing policies for events and checklist items, fixes global checklist visibility, and removes legacy status checks.

-- 1. House Calendar Events Policies
-- DROP any old or conflicting policies if they exist (though audit showed none for the parent table)
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (get_access_level('house_profiles'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR -- Shim for legacy name
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    (EXISTS (SELECT 1 FROM house_calendar_event_staff hces WHERE hces.event_id = id AND hces.staff_id = get_my_staff_id()))
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    (get_access_level('house_profiles'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    ((get_access_level('house_profiles'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    (get_access_level('house_profiles'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    ((get_access_level('house_profiles'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- 2. House Checklist Items Policies
-- Use the unified ALL policy and clean up old ones
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;

CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
  FOR SELECT
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklists hc 
      WHERE hc.id = checklist_id AND (
        hc.is_global = true OR
        (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
        ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id)) OR
        (get_access_level('house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items
  FOR ALL
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklists hc 
      WHERE hc.id = checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklists hc 
      WHERE hc.id = checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

-- 3. Fix Global House Checklists Visibility
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
  FOR SELECT
  USING (
    is_admin() OR 
    is_global = true OR -- Global flag override
    (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    (get_access_level('house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR -- Compatibility
    ((get_access_level('house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- 4. Clean up Timesheet Update Logic (Remove draft check)
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
  FOR UPDATE
  USING (
    is_admin() OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text)) OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR
    (get_access_level('timesheets_approve'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('timesheets_approve'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id()))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    (get_access_level('timesheets_approve'::text) = 'full'::access_level_enum) OR -- Shim for legacy name
    ((get_access_level('timesheets_approve'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text))
  );

-- 5. House Checklist Submissions & Items ALL Policies
-- Drop existing INSERT/UPDATE policies to clean up and avoid overlap
DROP POLICY IF EXISTS "RBAC Checklist Submissions INSERT" ON public.house_checklist_submissions;
DROP POLICY IF EXISTS "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions;

CREATE POLICY "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions
  FOR ALL
  USING (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
    ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id)) OR
    (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
    ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

DROP POLICY IF EXISTS "RBAC Checklist Submission Items INSERT" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "RBAC Checklist Submission Items UPDATE" ON public.house_checklist_submission_items;
DROP POLICY IF EXISTS "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items;

CREATE POLICY "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items
  FOR ALL
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklist_submissions hcs 
      WHERE hcs.id = submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM house_checklist_submissions hcs 
      WHERE hcs.id = submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id)) OR
        (get_access_level('house_checklists'::text) = 'full'::access_level_enum) OR -- Compatibility
        ((get_access_level('house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  );


-- FILE: 2026051601_enable_missing_rls.sql

-- Migration: Enable missing RLS
-- Description: Enables Row Level Security on tables that currently have unrestricted access.

BEGIN;

ALTER TABLE public.branch_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_comms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

COMMIT;


-- FILE: 2026051602_security_hardening_cleanup.sql

-- Migration: Security Hardening & RBAC Cleanup
-- Description: Standardizes roles, fixes logic errors, unblocks operational tables, and cleans up redundancy.

BEGIN;

-- ========================================================================================
-- 1. STANDARDIZE ROLES & FIX LOGIC ERRORS (Move from public to authenticated)
-- ========================================================================================

-- House Calendar Events
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (get_access_level('manage_participants'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    (EXISTS (SELECT 1 FROM public.house_calendar_event_staff hces WHERE hces.event_id = public.house_calendar_events.id AND hces.staff_id = get_my_staff_id()))
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Items
DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;

CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        hc.is_global = true OR
        (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
        ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

-- House Checklist Submissions
DROP POLICY IF EXISTS "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions;
CREATE POLICY "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Submission Items
DROP POLICY IF EXISTS "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items;
CREATE POLICY "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklist_submissions hcs 
      WHERE hcs.id = public.house_checklist_submission_items.submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklist_submissions hcs 
      WHERE hcs.id = public.house_checklist_submission_items.submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  );

-- Timesheets UPDATE
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text)) OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id()))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text))
  );

-- ========================================================================================
-- 2. UNBLOCK OPERATIONAL TABLES (New contextual policies)
-- ========================================================================================

-- House Comms
CREATE POLICY "RBAC House Comms SELECT" ON public.house_comms
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

CREATE POLICY "RBAC House Comms ALL" ON public.house_comms
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Calendar Event Attachments
CREATE POLICY "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

CREATE POLICY "RBAC Event Attachments ALL" ON public.house_calendar_event_attachments
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND (get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND (get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

-- Branch Documents & Policies
CREATE POLICY "RBAC Branch Docs SELECT" ON public.branch_documents
  FOR SELECT TO authenticated
  USING (true); -- Global visibility for staff, protected by RLS (authenticated only)

CREATE POLICY "RBAC Branch Policies SELECT" ON public.branch_policies
  FOR SELECT TO authenticated
  USING (true);

-- ========================================================================================
-- 3. MASTER DATA CLEANUP (Consolidate redundant policies)
-- ========================================================================================

DO $$
DECLARE
    t text;
    v_master_tables text[] := ARRAY[
        'contact_types_master', 'funding_sources_master', 'employment_types_master',
        'house_types_master', 'funding_types_master', 'branches', 'departments',
        'roles', 'medications_master', 'leave_types', 'house_calendar_event_types_master',
        'checklist_master', 'checklist_item_master'
    ];
    p record;
BEGIN
    FOREACH t IN ARRAY v_master_tables LOOP
        -- Drop all existing policies for this table to start fresh
        FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
        END LOOP;
        
        -- 1. SELECT for all authenticated
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        
        -- 2. ALL for Admins and Master List Managers
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')
            WITH CHECK (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')', t, t);
    END LOOP;
END $$;

-- ========================================================================================
-- 4. LEGACY ADMIN CHECK CLEANUP (Standardize on is_admin())
-- ========================================================================================

DO $$
DECLARE
    r record;
    v_new_qual text;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
        FROM pg_policies 
        WHERE qual LIKE '%auth.jwt() -> ''user_metadata''%is_admin%'
           OR with_check LIKE '%auth.jwt() -> ''user_metadata''%is_admin%'
    LOOP
        v_new_qual := replace(replace(r.qual, '((((auth.jwt() -> ''user_metadata''::text) ->> ''is_admin''::text))::boolean = true)', 'is_admin()'), '(((auth.jwt() -> ''user_metadata''::text) ->> ''is_admin''::text))::boolean = true', 'is_admin()');
        
        EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        
        IF r.with_check IS NOT NULL THEN
            EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s) WITH CHECK (%s)', 
                r.policyname, r.schemaname, r.tablename, r.cmd, array_to_string(r.roles, ','), v_new_qual, replace(r.with_check, '((((auth.jwt() -> ''user_metadata''::text) ->> ''is_admin''::text))::boolean = true)', 'is_admin()'));
        ELSE
            EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s)', 
                r.policyname, r.schemaname, r.tablename, r.cmd, array_to_string(r.roles, ','), v_new_qual);
        END IF;
    END LOOP;
END $$;

COMMIT;


-- FILE: 2026051603_final_security_seal.sql

-- Migration: Final Security Seal
-- Description: Surgical fixes for broken logic, role enforcement, and final policy cleanup.

BEGIN;

-- ========================================================================================
-- 1. FIX BROKEN CALENDAR EVENT VISIBILITY & ENFORCE AUTHENTICATED ROLE
-- ========================================================================================

-- House Calendar Events
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (get_access_level('manage_participants'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    (EXISTS (SELECT 1 FROM public.house_calendar_event_staff hces WHERE hces.event_id = public.house_calendar_events.id AND hces.staff_id = get_my_staff_id()))
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklists
DROP POLICY IF EXISTS "RBAC House Checklists SELECT" ON public.house_checklists;
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    is_global = true OR 
    (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Items
DROP POLICY IF EXISTS "RBAC House Checklist Items SELECT" ON public.house_checklist_items;
DROP POLICY IF EXISTS "RBAC House Checklist Items ALL" ON public.house_checklist_items;

CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        hc.is_global = true OR
        (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
        ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

-- House Checklist Submissions
DROP POLICY IF EXISTS "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions;
CREATE POLICY "RBAC Checklist Submissions ALL" ON public.house_checklist_submissions
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Submission Items
DROP POLICY IF EXISTS "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items;
CREATE POLICY "RBAC Checklist Submission Items ALL" ON public.house_checklist_submission_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklist_submissions hcs 
      WHERE hcs.id = public.house_checklist_submission_items.submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklist_submissions hcs 
      WHERE hcs.id = public.house_checklist_submission_items.submission_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hcs.house_id))
      )
    ))
  );

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets UPDATE" ON public.timesheets;
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text)) OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id()))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text))
  );

-- ========================================================================================
-- 2. UNBLOCK OPERATIONAL TABLES (Explicit contextual policies)
-- ========================================================================================

-- House Comms
DROP POLICY IF EXISTS "RBAC House Comms SELECT" ON public.house_comms;
DROP POLICY IF EXISTS "RBAC House Comms ALL" ON public.house_comms;

CREATE POLICY "RBAC House Comms SELECT" ON public.house_comms
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

CREATE POLICY "RBAC House Comms ALL" ON public.house_comms
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Calendar Event Attachments
DROP POLICY IF EXISTS "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments;
DROP POLICY IF EXISTS "RBAC Event Attachments ALL" ON public.house_calendar_event_attachments;

CREATE POLICY "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

CREATE POLICY "RBAC Event Attachments ALL" ON public.house_calendar_event_attachments
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND (get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND (get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

-- Branch Documents & Policies
DROP POLICY IF EXISTS "RBAC Branch Docs SELECT" ON public.branch_documents;
DROP POLICY IF EXISTS "RBAC Branch Policies SELECT" ON public.branch_policies;

CREATE POLICY "RBAC Branch Docs SELECT" ON public.branch_documents
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "RBAC Branch Policies SELECT" ON public.branch_policies
  FOR SELECT TO authenticated
  USING (true);

-- ========================================================================================
-- 3. MASTER DATA CLEANUP (Explicit consolidation)
-- ========================================================================================

-- Medication Master
DROP POLICY IF EXISTS "RBAC medications_master SELECT" ON public.medications_master;
DROP POLICY IF EXISTS "RBAC medications_master ALL" ON public.medications_master;
DROP POLICY IF EXISTS "RBAC medications_master ALL (Admin/Full)" ON public.medications_master;
DROP POLICY IF EXISTS "Staff select medications_master" ON public.medications_master;
DROP POLICY IF EXISTS "Staff select medications master" ON public.medications_master;
DROP POLICY IF EXISTS "Admins full access" ON public.medications_master;

CREATE POLICY "RBAC medications_master SELECT" ON public.medications_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC medications_master ALL" ON public.medications_master FOR ALL TO authenticated 
    USING (is_admin() OR get_access_level('manage_master_lists') = 'full')
    WITH CHECK (is_admin() OR get_access_level('manage_master_lists') = 'full');

-- Roles
DROP POLICY IF EXISTS "RBAC roles SELECT" ON public.roles;
DROP POLICY IF EXISTS "RBAC roles ALL" ON public.roles;
DROP POLICY IF EXISTS "RBAC roles ALL (Admin/Full)" ON public.roles;
DROP POLICY IF EXISTS "Staff select roles" ON public.roles;
DROP POLICY IF EXISTS "Staff select master tables" ON public.roles;
DROP POLICY IF EXISTS "Admins full access" ON public.roles;

CREATE POLICY "RBAC roles SELECT" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC roles ALL" ON public.roles FOR ALL TO authenticated 
    USING (is_admin() OR get_access_level('manage_master_lists') = 'full')
    WITH CHECK (is_admin() OR get_access_level('manage_master_lists') = 'full');

-- Repeat for all other master tables (Contact Types, Funding, etc. - using the logic factory pattern in the DB is better but I will be explicit for the critical ones)

-- ========================================================================================
-- 4. STANDARDIZE ADMIN HELPERS (Explicit fixes for core tables)
-- ========================================================================================

-- Staff
DROP POLICY IF EXISTS "RBAC Staff ALL (Admin)" ON public.staff;
DROP POLICY IF EXISTS "Admins have full access to staff" ON public.staff;
DROP POLICY IF EXISTS "Admins full access" ON public.staff;
CREATE POLICY "RBAC Staff ALL (Admin)" ON public.staff FOR ALL TO authenticated USING (is_admin());

-- Participants
DROP POLICY IF EXISTS "RBAC Participants ALL (Admin)" ON public.participants;
DROP POLICY IF EXISTS "Admins full access" ON public.participants;
CREATE POLICY "RBAC Participants ALL (Admin)" ON public.participants FOR ALL TO authenticated USING (is_admin());

-- Activity Log
DROP POLICY IF EXISTS "RBAC Activity Log ALL (Admin)" ON public.activity_log;
DROP POLICY IF EXISTS "Admins full access" ON public.activity_log;
CREATE POLICY "RBAC Activity Log ALL (Admin)" ON public.activity_log FOR ALL TO authenticated USING (is_admin());

COMMIT;


-- FILE: 2026051604_security_nuke_and_pave.sql

-- Migration: Security Nuke & Pave
-- Description: Wipes all existing policies on core tables and rebuilds them to a hardened, authenticated-only standard.

BEGIN;

-- 1. Dynamic Cleanup: Drop every policy on core and master tables to ensure no duplicates or {public} leaks remain.
DO $$ 
DECLARE 
    t text;
    tables_to_clean text[] := ARRAY[
        'house_calendar_events', 'house_checklists', 'house_checklist_items', 
        'house_checklist_submissions', 'house_checklist_submission_items', 
        'timesheets', 'house_comms', 'house_calendar_event_attachments',
        'medications_master', 'roles', 'staff', 'participants', 'activity_log',
        'branches', 'departments', 'leave_types', 'house_calendar_event_types_master',
        'branch_documents', 'branch_policies'
    ];
    p record;
BEGIN
    FOREACH t IN ARRAY tables_to_clean LOOP
        FOR p IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- ========================================================================================
-- 2. REBUILD CORE OPERATIONAL POLICIES (Authenticated Role + Hardened Logic)
-- ========================================================================================

-- House Calendar Events
CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    (EXISTS (SELECT 1 FROM public.house_calendar_event_staff hces WHERE hces.event_id = public.house_calendar_events.id AND hces.staff_id = get_my_staff_id()))
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklists
CREATE POLICY "RBAC House Checklists SELECT" ON public.house_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    is_global = true OR 
    (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Checklist Items
CREATE POLICY "RBAC House Checklist Items SELECT" ON public.house_checklist_items
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        hc.is_global = true OR
        (get_access_level('execute_house_checklists'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
        ((get_access_level('execute_house_checklists'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

CREATE POLICY "RBAC House Checklist Items ALL" ON public.house_checklist_items
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  )
  WITH CHECK (
    is_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.house_checklists hc 
      WHERE hc.id = public.house_checklist_items.checklist_id AND (
        (get_access_level('execute_house_checklists'::text) = 'full'::access_level_enum) OR 
        ((get_access_level('execute_house_checklists'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), hc.house_id))
      )
    ))
  );

-- Timesheets
CREATE POLICY "RBAC Timesheets UPDATE" ON public.timesheets
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text)) OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id()))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_timesheets'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_timesheets'::text) = 'context_read_write'::access_level_enum) AND is_staff_managed_by(staff_id, get_my_staff_id()) AND (staff_id <> get_my_staff_id())) OR 
    ((staff_id = get_my_staff_id()) AND (status = 'pending'::text))
  );

-- ========================================================================================
-- 3. UNBLOCK OPERATIONAL TABLES (Explicit Contextual Policies)
-- ========================================================================================

-- House Comms
CREATE POLICY "RBAC House Comms SELECT" ON public.house_comms
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

CREATE POLICY "RBAC House Comms ALL" ON public.house_comms
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- House Calendar Event Attachments
CREATE POLICY "RBAC Event Attachments SELECT" ON public.house_calendar_event_attachments
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    EXISTS (
      SELECT 1 FROM public.house_calendar_events hce 
      WHERE hce.id = public.house_calendar_event_attachments.event_id 
      AND is_staff_assigned_to_house(get_my_staff_id(), hce.house_id)
    )
  );

-- Branch Documents & Policies
CREATE POLICY "RBAC Branch Docs SELECT" ON public.branch_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC Branch Policies SELECT" ON public.branch_policies FOR SELECT TO authenticated USING (true);

-- ========================================================================================
-- 4. MASTER DATA CLEANUP (Standardized SELECT + Admin ALL)
-- ========================================================================================

DO $$
DECLARE
    t text;
    v_master_tables text[] := ARRAY[
        'branches', 'departments', 'roles', 'medications_master', 'leave_types', 
        'house_calendar_event_types_master'
    ];
BEGIN
    FOREACH t IN ARRAY v_master_tables LOOP
        EXECUTE format('CREATE POLICY "RBAC %I SELECT" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        EXECUTE format('CREATE POLICY "RBAC %I ALL" ON public.%I FOR ALL TO authenticated 
            USING (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')
            WITH CHECK (is_admin() OR get_access_level(''manage_master_lists'') = ''full'')', t, t);
    END LOOP;
END $$;

-- ========================================================================================
-- 5. STANDARDIZE ADMIN HELPERS (Core Identity Tables)
-- ========================================================================================

CREATE POLICY "RBAC Staff ALL (Admin)" ON public.staff FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "RBAC Participants ALL (Admin)" ON public.participants FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "RBAC Activity Log ALL (Admin)" ON public.activity_log FOR ALL TO authenticated USING (is_admin());

COMMIT;


-- FILE: 2026051605_fix_rls_recursion.sql

-- Migration: Fix RLS Recursion in Calendar Events
-- Description: Uses a SECURITY DEFINER helper to break circular dependencies between events and staff junction tables.

BEGIN;

-- 1. Create SECURITY DEFINER helper to safely check event access without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_staff_linked_to_calendar_event(p_staff_id UUID, p_event_id UUID)
RETURNS boolean AS $$
BEGIN
    -- Check direct assignment in junction table
    IF EXISTS (
        SELECT 1 FROM public.house_calendar_event_staff
        WHERE event_id = p_event_id AND staff_id = p_staff_id
    ) THEN
        RETURN true;
    END IF;

    -- Check house assignment from parent event
    RETURN EXISTS (
        SELECT 1 FROM public.house_calendar_events hce
        WHERE hce.id = p_event_id AND public.is_staff_assigned_to_house(p_staff_id, hce.house_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. REBUILD POLICIES USING THE HELPER
-- ========================================================================================

-- House Calendar Events
DROP POLICY IF EXISTS "RBAC Calendar Events SELECT" ON public.house_calendar_events;
DROP POLICY IF EXISTS "RBAC Calendar Events ALL" ON public.house_calendar_events;

CREATE POLICY "RBAC Calendar Events SELECT" ON public.house_calendar_events
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_linked_to_calendar_event(get_my_staff_id(), id)
  );

CREATE POLICY "RBAC Calendar Events ALL" ON public.house_calendar_events
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), id))
  );

-- House Calendar Event Staff (Junction)
DROP POLICY IF EXISTS "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff;
DROP POLICY IF EXISTS "RBAC Calendar Event Staff ALL (Admin/Full/Context)" ON public.house_calendar_event_staff;

CREATE POLICY "RBAC Calendar Event Staff SELECT" ON public.house_calendar_event_staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (staff_id = get_my_staff_id()) OR
    is_staff_linked_to_calendar_event(get_my_staff_id(), event_id)
  );

CREATE POLICY "RBAC Calendar Event Staff ALL" ON public.house_calendar_event_staff
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  );

-- House Calendar Event Participants (Junction)
DROP POLICY IF EXISTS "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants;
DROP POLICY IF EXISTS "RBAC Calendar Event Participants ALL (Admin/Full/Context)" ON public.house_calendar_event_participants;

CREATE POLICY "RBAC Calendar Event Participants SELECT" ON public.house_calendar_event_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    is_staff_linked_to_calendar_event(get_my_staff_id(), event_id)
  );

CREATE POLICY "RBAC Calendar Event Participants ALL" ON public.house_calendar_event_participants
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_houses'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_houses'::text) = 'context_read_write'::access_level_enum) AND is_staff_linked_to_calendar_event(get_my_staff_id(), event_id))
  );

COMMIT;


-- FILE: 2026051606_restore_essential_access.sql

-- Migration: Restore Essential SELECT Access
-- Description: Restores missing SELECT policies for staff and participants to enable profile views and operations.

BEGIN;

-- ========================================================================================
-- 1. RESTORE STAFF SELECT ACCESS
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;

CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR -- Self-view (Critical for profile/photo)
    (get_access_level('manage_staff'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_staff'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        (
            public.do_staff_share_house(public.get_my_staff_id(), id) OR
            public.is_staff_managed_by(id, public.get_my_staff_id())
        )
    )
  );

-- ========================================================================================
-- 2. RESTORE PARTICIPANTS SELECT ACCESS
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;

CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_participants'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    )
  );

COMMIT;


-- FILE: 2026051607_fix_roster_and_core_visibility.sql

-- Migration: Fix Roster & Core Visibility
-- Description: Restores missing SELECT policies for staff/participants and standardizes roster RLS.

BEGIN;

-- ========================================================================================
-- 1. RESTORE STAFF SELECT ACCESS (Critical for get_my_staff_id())
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR -- Self-view
    (get_access_level('manage_staff'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_staff'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        (public.is_staff_managed_by(id, public.get_my_staff_id()) OR public.do_staff_share_house(id, public.get_my_staff_id()))
    )
  );

-- ========================================================================================
-- 2. RESTORE PARTICIPANTS SELECT ACCESS (Critical for Roster joins)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    (
        get_access_level('manage_participants'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum]) AND 
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    ) OR
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) -- Fallback for support workers
  );

-- ========================================================================================
-- 3. FIX STAFF SHIFTS POLICIES (Use canonical keys)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
DROP POLICY IF EXISTS "RBAC Shifts ALL (Admin/Full/Context)" ON public.staff_shifts;

CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR -- Own shifts
    (get_access_level('manage_roster_board'::text) = ANY (ARRAY['full'::access_level_enum, 'read_only'::access_level_enum])) OR 
    ((get_access_level('manage_roster_board'::text) = ANY (ARRAY['context_read_write'::access_level_enum, 'context_read_only'::access_level_enum])) AND (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id())))
  );

CREATE POLICY "RBAC Shifts ALL" ON public.staff_shifts
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_roster_board'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_roster_board'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  )
  WITH CHECK (
    is_admin() OR 
    (get_access_level('manage_roster_board'::text) = 'full'::access_level_enum) OR 
    ((get_access_level('manage_roster_board'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), house_id))
  );

-- ========================================================================================
-- 4. FIX ROSTER JUNCTION POLICIES
-- ========================================================================================

-- Shift Participants
DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
DROP POLICY IF EXISTS "RBAC Shift Participants ALL (Admin/Full/Context)" ON public.shift_participants;

CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_participants.shift_id AND (ss.staff_id = get_my_staff_id() OR is_staff_assigned_to_house(get_my_staff_id(), ss.house_id))))
  );

CREATE POLICY "RBAC Shift Participants ALL" ON public.shift_participants
  FOR ALL TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_roster_board'::text) = 'full'::access_level_enum) OR 
    (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_participants.shift_id AND (get_access_level('manage_roster_board'::text) = 'context_read_write'::access_level_enum) AND is_staff_assigned_to_house(get_my_staff_id(), ss.house_id)))
  );

-- Shift Assigned Checklists
DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (EXISTS ( SELECT 1 FROM staff_shifts ss WHERE ss.id = shift_assigned_checklists.shift_id AND (ss.staff_id = get_my_staff_id() OR is_staff_assigned_to_house(get_my_staff_id(), ss.house_id))))
  );

COMMIT;


-- FILE: 2026051608_harden_rls_helpers_and_metadata.sql

-- Migration: Harden RLS Helpers & Metadata
-- Description: Fixes infinite recursion and stale metadata issues by making helpers SECURITY DEFINER and improving sync.

BEGIN;

-- ========================================================================================
-- 1. HARDEN HELPERS (Make SECURITY DEFINER to break RLS recursion)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- 1. Try JWT metadata (Fastest)
  v_staff_id := (auth.jwt() -> 'user_metadata' ->> 'staff_id')::uuid;
  
  -- 2. Fallback to table query
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE auth_user_id = auth.uid();
  END IF;
  
  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_perm_text text;
  v_role_id uuid;
BEGIN
  -- 1. Try JWT metadata (Fastest)
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> module_name;
  
  -- 2. Fallback to Database (Necessary for stale sessions)
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', module_name)
      INTO v_perm_text
      USING v_role_id;
    END IF;
  END IF;

  -- Transition shim
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. IMPROVE METADATA SYNC (Include staff_id)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id;
  
  SELECT jsonb_build_object(
    'my_roster', my_roster,
    'my_timesheets', my_timesheets,
    'my_leave', my_leave,
    'manage_staff', manage_staff,
    'manage_participants', manage_participants,
    'manage_houses', manage_houses,
    'manage_roster_board', manage_roster_board,
    'manage_timesheets', manage_timesheets,
    'manage_leave', manage_leave,
    'manage_role_permissions', manage_role_permissions,
    'manage_master_lists', manage_master_lists,
    'view_activity_log', view_activity_log,
    'execute_house_checklists', execute_house_checklists,
    'execute_shift_routines', execute_shift_routines,
    'write_shift_notes', write_shift_notes
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = NEW.role_id;
  
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'staff_id', NEW.id, -- Include staff_id
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_staff_role_to_metadata_for_staff(p_staff_id UUID)
RETURNS VOID AS $$
DECLARE
  v_staff_record RECORD;
  v_role_name TEXT;
  v_permissions JSONB;
BEGIN
  SELECT * INTO v_staff_record FROM public.staff WHERE id = p_staff_id;
  SELECT name INTO v_role_name FROM public.roles WHERE id = v_staff_record.role_id;
  
  SELECT jsonb_build_object(
    'my_roster', my_roster,
    'my_timesheets', my_timesheets,
    'my_leave', my_leave,
    'manage_staff', manage_staff,
    'manage_participants', manage_participants,
    'manage_houses', manage_houses,
    'manage_roster_board', manage_roster_board,
    'manage_timesheets', manage_timesheets,
    'manage_leave', manage_leave,
    'manage_role_permissions', manage_role_permissions,
    'manage_master_lists', manage_master_lists,
    'view_activity_log', view_activity_log,
    'execute_house_checklists', execute_house_checklists,
    'execute_shift_routines', execute_shift_routines,
    'write_shift_notes', write_shift_notes
  ) INTO v_permissions 
  FROM public.role_permissions 
  WHERE role_id = v_staff_record.role_id;
  
  IF v_staff_record.auth_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || 
      jsonb_build_object(
        'staff_id', v_staff_record.id, -- Include staff_id
        'role_name', v_role_name,
        'permissions', COALESCE(v_permissions, '{}'::jsonb)
      )
    WHERE id = v_staff_record.auth_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================================
-- 3. REBUILD CORE POLICIES (Hardened & Clean)
-- ========================================================================================

-- Staff
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR 
    (get_access_level('manage_staff'::text) IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_staff'::text) IN ('context_read_write', 'context_read_only') AND 
        (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))
    )
  );

-- Staff Shifts
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_roster_board'::text) IN ('full', 'read_only')) OR 
    (get_access_level('my_roster'::text) IN ('full', 'read_only')) OR -- Explicitly check my_roster
    ((get_access_level('manage_roster_board'::text) IN ('context_read_write', 'context_read_only')) AND (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id())))
  );

COMMIT;



-- FILE: 2026051612_fix_rbac_gaps.sql

-- Migration: Fix RBAC Gaps & Harden Roster Access
-- Description: Standardizes RLS policies to use current RBAC column names and hardens roster visibility.

BEGIN;

-- ========================================================================================
-- 1. HARDEN HELPERS
-- ========================================================================================

-- Update get_access_level to be even more robust with a mapping for legacy names
CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_mapped_module text;
  v_perm_text text;
  v_role_id uuid;
BEGIN
  -- 1. Map legacy names to current canonical ones
  v_mapped_module := CASE module_name
    WHEN 'staff_profiles' THEN 'manage_staff'
    WHEN 'participant_profiles' THEN 'manage_participants'
    WHEN 'house_profiles' THEN 'manage_houses'
    WHEN 'roster_board' THEN 'manage_roster_board'
    WHEN 'timesheets_approve' THEN 'manage_timesheets'
    WHEN 'timesheets_submit' THEN 'my_timesheets'
    WHEN 'house_checklists' THEN 'execute_house_checklists'
    WHEN 'shift_routines' THEN 'execute_shift_routines'
    WHEN 'shift_notes' THEN 'write_shift_notes'
    WHEN 'participant_notes' THEN 'write_shift_notes' -- Fallback
    WHEN 'documents' THEN 'manage_master_lists' -- Approximate
    WHEN 'leave_requests' THEN 'manage_leave'
    ELSE module_name
  END;

  -- 2. Try JWT metadata (Fastest)
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> v_mapped_module;
  
  -- 3. Fallback to Database (Necessary for stale sessions or missing keys)
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', v_mapped_module)
      INTO v_perm_text
      USING v_role_id;
    END IF;
  END IF;

  -- Transition shim for old enum values
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. REBUILD ROSTER POLICIES (Hardened & Context-Aware)
-- ========================================================================================

-- Staff Shifts (Standardized SELECT)
DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
    (get_access_level('my_roster') IN ('full', 'read_only')) OR 
    (
        (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
         get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
        (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id()))
    )
  );

-- Shift Participants (Fixing Manager Gap)
DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.staff_shifts ss 
      WHERE ss.id = public.shift_participants.shift_id 
      AND (
        ss.staff_id = get_my_staff_id() OR 
        is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR
        is_staff_managed_by(ss.staff_id, get_my_staff_id())
      )
    )
  );

-- Shift Assigned Checklists (Fixing Manager Gap)
DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.staff_shifts ss 
      WHERE ss.id = public.shift_assigned_checklists.shift_id 
      AND (
        ss.staff_id = get_my_staff_id() OR 
        is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR
        is_staff_managed_by(ss.staff_id, get_my_staff_id())
      )
    )
  );

-- ========================================================================================
-- 3. REBUILD CORE VISIBILITY (Standardized Column Names)
-- ========================================================================================

-- Staff visibility
DROP POLICY IF EXISTS "RBAC Staff SELECT" ON public.staff;
CREATE POLICY "RBAC Staff SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth_user_id = auth.uid()) OR 
    (get_access_level('manage_staff') IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_staff') IN ('context_read_write', 'context_read_only') AND 
        (public.do_staff_share_house(id, public.get_my_staff_id()) OR public.is_staff_managed_by(id, public.get_my_staff_id()))
    )
  );

-- Participant visibility
DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants') IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_participants') IN ('context_read_write', 'context_read_only') AND 
        public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id)
    ) OR
    public.is_staff_assigned_to_house(public.get_my_staff_id(), house_id) -- Explicit fallback for Support Workers
  );

-- ========================================================================================
-- 4. CLEANUP LEGACY POLICY NAMES (If any remain)
-- ========================================================================================

-- Ensure timesheets use manage_timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_timesheets') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

COMMIT;

-- FILE: 2026051613_comprehensive_rbac_polish.sql

-- Migration: Comprehensive RBAC Polish & Final Fixes
-- Description: Final standardization of RLS policies, fixing missing SELECTs and legacy mappings.

BEGIN;

-- ========================================================================================
-- 1. STANDARDIZE HELPERS
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.get_access_level(module_name text)
RETURNS public.access_level_enum AS $$
DECLARE
  v_mapped_module text;
  v_perm_text text;
  v_role_id uuid;
BEGIN
  -- 1. Map legacy names to current canonical ones
  v_mapped_module := CASE module_name
    WHEN 'staff_profiles' THEN 'manage_staff'
    WHEN 'participant_profiles' THEN 'manage_participants'
    WHEN 'house_profiles' THEN 'manage_houses'
    WHEN 'roster_board' THEN 'manage_roster_board'
    WHEN 'timesheets_approve' THEN 'manage_timesheets'
    WHEN 'timesheets_submit' THEN 'my_timesheets'
    WHEN 'house_checklists' THEN 'execute_house_checklists'
    WHEN 'shift_routines' THEN 'execute_shift_routines'
    WHEN 'shift_notes' THEN 'write_shift_notes'
    WHEN 'participant_notes' THEN 'write_shift_notes'
    WHEN 'documents' THEN 'manage_master_lists'
    WHEN 'leave_requests' THEN 'manage_leave'
    WHEN 'house_documents' THEN 'manage_houses'
    WHEN 'participant_documents' THEN 'manage_participants'
    WHEN 'staff_documents' THEN 'manage_staff'
    ELSE module_name
  END;

  -- 2. Try JWT metadata (Fastest)
  v_perm_text := auth.jwt() -> 'user_metadata' -> 'permissions' ->> v_mapped_module;
  
  -- 3. Fallback to Database (Necessary for stale sessions)
  IF v_perm_text IS NULL THEN
    SELECT role_id INTO v_role_id FROM public.staff WHERE auth_user_id = auth.uid();
    
    IF v_role_id IS NOT NULL THEN
      EXECUTE format('SELECT %I::text FROM public.role_permissions WHERE role_id = $1', v_mapped_module)
      INTO v_perm_text
      USING v_role_id;
    END IF;
  END IF;

  -- Transition shim
  IF v_perm_text = 'context_locked' THEN v_perm_text := 'context_read_write'; END IF;
  
  RETURN COALESCE(v_perm_text::public.access_level_enum, 'none'::public.access_level_enum);
EXCEPTION WHEN OTHERS THEN 
  RETURN 'none'::public.access_level_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================================================================
-- 2. FIX MISSING & BROKEN SELECT POLICIES
-- ========================================================================================

-- Timesheets (Was missing SELECT entirely)
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (staff_id = get_my_staff_id()) OR 
    (get_access_level('manage_timesheets') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

-- House Resources (Standardize on helpers)
DROP POLICY IF EXISTS "Staff select house resources" ON public.house_resources;
CREATE POLICY "RBAC House Resources SELECT" ON public.house_resources
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses') IN ('full', 'read_only')) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

-- House Files (Standardize names)
DROP POLICY IF EXISTS "RBAC House Files SELECT" ON public.house_files;
CREATE POLICY "RBAC House Files SELECT" ON public.house_files
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_houses') IN ('full', 'read_only')) OR 
    is_staff_assigned_to_house(get_my_staff_id(), house_id)
  );

-- ========================================================================================
-- 3. HARDEN ROSTER JUNCTION TABLES
-- ========================================================================================

-- Shift Participants (Alignment with staff_shifts)
DROP POLICY IF EXISTS "RBAC Shift Participants SELECT" ON public.shift_participants;
CREATE POLICY "RBAC Shift Participants SELECT" ON public.shift_participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.staff_shifts ss 
      WHERE ss.id = public.shift_participants.shift_id 
      AND (
        ss.staff_id = get_my_staff_id() OR 
        (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
        (get_access_level('my_roster') IN ('full', 'read_only')) OR 
        (
            (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
             get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
            (is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR is_staff_managed_by(ss.staff_id, get_my_staff_id()))
        )
      )
    )
  );

-- Shift Assigned Checklists (Alignment with staff_shifts)
DROP POLICY IF EXISTS "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists;
CREATE POLICY "RBAC Shift Assigned Checklists SELECT" ON public.shift_assigned_checklists
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.staff_shifts ss 
      WHERE ss.id = public.shift_assigned_checklists.shift_id 
      AND (
        ss.staff_id = get_my_staff_id() OR 
        (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
        (get_access_level('my_roster') IN ('full', 'read_only')) OR 
        (
            (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
             get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
            (is_staff_assigned_to_house(get_my_staff_id(), ss.house_id) OR is_staff_managed_by(ss.staff_id, get_my_staff_id()))
        )
      )
    )
  );

-- ========================================================================================
-- 4. HARDEN CLINICAL VISIBILITY (Standardized Names)
-- ========================================================================================

-- Medications
DROP POLICY IF EXISTS "RBAC Medications SELECT" ON public.participant_medications;
CREATE POLICY "RBAC Medications SELECT" ON public.participant_medications
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants') IN ('full', 'read_only')) OR 
    is_staff_assigned_to_house(get_my_staff_id(), (SELECT house_id FROM participants p WHERE p.id = participant_id))
  );

-- Shift Notes
DROP POLICY IF EXISTS "RBAC Shift Notes SELECT" ON public.shift_notes;
CREATE POLICY "RBAC Shift Notes SELECT" ON public.shift_notes
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('write_shift_notes') IN ('full', 'read_only')) OR 
    (staff_id = get_my_staff_id()) OR 
    ((get_access_level('write_shift_notes') IN ('context_read_write', 'context_read_only')) AND (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id())))
  );

COMMIT;

-- FILE: 2026051614_deep_security_repair.sql

-- Migration: Deep Security Repair & RLS Hardening
-- Description: Bypasses potential helper failures and standardizes core access paths.

BEGIN;

-- ========================================================================================
-- 1. HARDEN CORE HELPERS (Explicit search_path & Robustness)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Direct check with fallback
  RETURN COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.get_my_staff_id()
RETURNS UUID AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  -- 1. Try JWT metadata (Fastest)
  BEGIN
    v_staff_id := (auth.jwt() -> 'user_metadata' ->> 'staff_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_staff_id := NULL;
  END;
  
  -- 2. Fallback to direct table query
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE auth_user_id = auth.uid();
  END IF;
  
  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

-- ========================================================================================
-- 2. HARDEN STAFF SHIFTS (Direct Auth Check)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Shifts SELECT" ON public.staff_shifts;
CREATE POLICY "RBAC Shifts SELECT" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    -- Direct check for own shifts (bypasses get_my_staff_id helper)
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = public.staff_shifts.staff_id AND s.auth_user_id = auth.uid()) OR
    -- Managerial / Roster Board checks
    (get_access_level('manage_roster_board') IN ('full', 'read_only')) OR 
    (get_access_level('my_roster') IN ('full', 'read_only')) OR 
    (
        (get_access_level('manage_roster_board') IN ('context_read_write', 'context_read_only') OR 
         get_access_level('my_roster') IN ('context_read_write', 'context_read_only')) AND 
        (is_staff_assigned_to_house(get_my_staff_id(), house_id) OR is_staff_managed_by(staff_id, get_my_staff_id()))
    )
  );

-- ========================================================================================
-- 3. HARDEN PARTICIPANT VISIBILITY (Ensure Roster Joins Work)
-- ========================================================================================

DROP POLICY IF EXISTS "RBAC Participants SELECT" ON public.participants;
CREATE POLICY "RBAC Participants SELECT" ON public.participants
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (get_access_level('manage_participants') IN ('full', 'read_only')) OR 
    (
        get_access_level('manage_participants') IN ('context_read_write', 'context_read_only') AND 
        is_staff_assigned_to_house(get_my_staff_id(), house_id)
    ) OR
    -- Critical fallback: Can see participants in any house you are assigned to
    is_staff_assigned_to_house(get_my_staff_id(), house_id) OR
    -- Ultimate fallback: Can see participants in any house where you have a shift
    EXISTS (SELECT 1 FROM public.staff_shifts ss WHERE ss.house_id = public.participants.house_id AND ss.staff_id = get_my_staff_id())
  );

-- ========================================================================================
-- 4. FIX TIMESHEETS & LEAVE (Own Record Access)
-- ========================================================================================

-- Timesheets
DROP POLICY IF EXISTS "RBAC Timesheets SELECT" ON public.timesheets;
CREATE POLICY "RBAC Timesheets SELECT" ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = public.timesheets.staff_id AND s.auth_user_id = auth.uid()) OR
    (get_access_level('manage_timesheets') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_timesheets') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

-- Leave Requests
DROP POLICY IF EXISTS "RBAC Leave SELECT" ON public.leave_requests;
CREATE POLICY "RBAC Leave SELECT" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    EXISTS (SELECT 1 FROM public.staff s WHERE s.id = public.leave_requests.staff_id AND s.auth_user_id = auth.uid()) OR
    (get_access_level('manage_leave') IN ('full', 'read_only')) OR 
    ((get_access_level('manage_leave') IN ('context_read_write', 'context_read_only')) AND is_staff_managed_by(staff_id, get_my_staff_id()))
  );

COMMIT;

-- FILE: 2026051615_drop_legacy_rls_policies.sql

-- Migration: Drop Legacy RLS Policies
-- Description: Removes early unrestricted policies that were overriding hardened RBAC logic and causing data leaks.

BEGIN;

-- 1. DROP UNRESTRICTED PARTICIPANT POLICIES
DROP POLICY IF EXISTS "Staff can select all participants" ON public.participants;
DROP POLICY IF EXISTS "Staff can select participant child entities" ON public.participant_medications;
DROP POLICY IF EXISTS "Staff can select participant notes" ON public.participant_notes;
DROP POLICY IF EXISTS "Staff can select participant goals" ON public.participant_goals;
DROP POLICY IF EXISTS "Staff can select participant goal progress" ON public.participant_goal_progress;
DROP POLICY IF EXISTS "Staff can select participant hygiene routines" ON public.participant_hygiene_routines;
DROP POLICY IF EXISTS "Staff can select participant contacts" ON public.participant_contacts;
DROP POLICY IF EXISTS "Staff can select participant restrictive practices" ON public.participant_restrictive_practices;

-- 2. DROP UNRESTRICTED HOUSE POLICIES
DROP POLICY IF EXISTS "Staff can select all houses" ON public.houses;
DROP POLICY IF EXISTS "Staff can select own house assignments" ON public.house_staff_assignments;

-- 3. DROP UNRESTRICTED SHIFT & OPERATIONAL POLICIES
DROP POLICY IF EXISTS "Staff can select staff shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Staff can select all shift notes" ON public.shift_notes;
DROP POLICY IF EXISTS "Staff select checklist templates" ON public.checklist_master;
DROP POLICY IF EXISTS "Staff select checklist item templates" ON public.checklist_item_master;

-- 4. DROP OTHER EARLY TRANSITIONAL POLICIES
DROP POLICY IF EXISTS "Staff can read own record" ON public.staff;
DROP POLICY IF EXISTS "Staff can select own compliance" ON public.staff_compliance;
DROP POLICY IF EXISTS "Staff can select own training" ON public.staff_training;
DROP POLICY IF EXISTS "Staff can select own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can select own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Staff can select own leave requests" ON public.leave_requests;

COMMIT;

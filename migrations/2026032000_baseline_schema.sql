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

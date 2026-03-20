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
  frequency text NULL,
  description text NULL,
  days_of_week text[] DEFAULT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT checklist_master_pkey PRIMARY KEY (id)
);

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
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);

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
  CONSTRAINT participants_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 4. DEPENDENT TABLES
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

CREATE TABLE IF NOT EXISTS public.house_checklists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  house_id uuid NULL REFERENCES houses (id) ON DELETE CASCADE,
  master_id uuid NULL REFERENCES checklist_master(id) ON DELETE SET NULL,
  name text NOT NULL,
  frequency text NULL,
  days_of_week text[] DEFAULT NULL,
  description text NULL,
  is_global boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklists_pkey PRIMARY KEY (id)
);

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
-- 5. RLS POLICIES
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
-- 6. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-attachments', 'checklist-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'checklist-attachments' );
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'checklist-attachments' );

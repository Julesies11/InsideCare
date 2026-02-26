create table public.participants (
  id uuid not null default gen_random_uuid (),
  name text null,
  email text null,
  address text null,
  date_of_birth date null,
  ndis_number text null,
  support_coordinator text null,
  allergies text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  support_level text null,
  routine text null,
  hygiene_support text null,
  current_goals text null,
  current_medications text null,
  general_notes text null,
  restrictive_practices text null,
  service_providers text null,
  house_id uuid null,
  photo_url text null,
  status public.status_enum not null default 'draft'::status_enum,
  house_phone text null,
  personal_mobile text null,
  primary_diagnosis text null,
  secondary_diagnosis text null,
  behaviour_of_concern text null,
  pbsp_engaged boolean null,
  bsp_available boolean null,
  specialist_name text null,
  specialist_phone text null,
  specialist_email text null,
  restrictive_practice_authorisation boolean null,
  restrictive_practice_details text null,
  restrictive_practices_yn boolean null,
  mtmp_required boolean null,
  mtmp_details text null,
  mobility_support text null,
  meal_prep_support text null,
  household_support text null,
  communication_type character varying(20) null,
  communication_notes text null,
  communication_language_needs text null,
  finance_support text null,
  health_wellbeing_support text null,
  cultural_religious_support text null,
  other_support text null,
  mental_health_plan text null,
  medical_plan text null,
  natural_disaster_plan text null,
  pharmacy_name text null,
  pharmacy_contact text null,
  pharmacy_location text null,
  gp_name text null,
  gp_contact text null,
  gp_location text null,
  psychiatrist_name text null,
  psychiatrist_contact text null,
  psychiatrist_location text null,
  medical_routine_other text null,
  medical_routine_general_process text null,
  move_in_date date null,
  constraint participants_pkey primary key (id),
  constraint participants_house_id_fkey foreign KEY (house_id) references houses (id) on update CASCADE on delete set null,
  constraint participant_email_required_when_active check (
    (
      (status <> 'active'::status_enum)
      or (email is not null)
    )
  ),
  constraint participant_name_required_when_active check (
    (
      (status <> 'active'::status_enum)
      or (
        (name is not null)
        and (
          length(
            TRIM(
              both
              from
                name
            )
          ) > 0
        )
      )
    )
  ),
  constraint participants_mtmp_details_required check (
    (
      (mtmp_required = false)
      or (
        (mtmp_details is not null)
        and (
          length(
            TRIM(
              both
              from
                mtmp_details
            )
          ) > 0
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_participants_house_id on public.participants using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_participants_status on public.participants using btree (status) TABLESPACE pg_default;

create table public.participant_restrictive_practices (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  practice_type text not null,
  description text not null,
  justification text not null,
  authorization_date date null,
  authorized_by text null,
  review_date date not null,
  status text null default 'Active'::text,
  conditions text null,
  alternatives_considered text null,
  monitoring_requirements text null,
  incident_reporting_protocol text null,
  is_ndis_reportable boolean null default true,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_restrictive_practices_pkey primary key (id),
  constraint participant_restrictive_practices_created_by_fkey foreign KEY (created_by) references staff (id) on delete set null,
  constraint participant_restrictive_practices_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_restrictive_participant on public.participant_restrictive_practices using btree (participant_id) TABLESPACE pg_default;

create trigger update_participant_restrictive_updated_at BEFORE
update on participant_restrictive_practices for EACH row
execute FUNCTION update_updated_at_column ();

create table public.participant_notes (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  note_type text null,
  content text not null,
  is_important boolean null default false,
  is_private boolean null default false,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_notes_pkey primary key (id),
  constraint participant_notes_created_by_fkey foreign KEY (created_by) references staff (id) on delete set null,
  constraint participant_notes_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notes_participant on public.participant_notes using btree (participant_id) TABLESPACE pg_default;

create trigger update_participant_notes_updated_at BEFORE
update on participant_notes for EACH row
execute FUNCTION update_updated_at_column ();

create table public.participant_medications (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  dosage text null,
  frequency text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  medication_id uuid null,
  constraint participant_medications_pkey primary key (id),
  constraint participant_medications_medication_id_fkey foreign KEY (medication_id) references medications_master (id) on delete RESTRICT,
  constraint participant_medications_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_medications_participant on public.participant_medications using btree (participant_id) TABLESPACE pg_default;

create index IF not exists idx_medications_active on public.participant_medications using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_participant_medications_medication_id on public.participant_medications using btree (medication_id) TABLESPACE pg_default;

create table public.participant_hygiene_routines (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  routine_type text not null,
  support_level text not null,
  frequency text null,
  time_of_day text null,
  duration_minutes integer null,
  specific_instructions text null,
  equipment_needed text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_hygiene_routines_pkey primary key (id),
  constraint participant_hygiene_routines_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_hygiene_participant on public.participant_hygiene_routines using btree (participant_id) TABLESPACE pg_default;

create trigger update_participant_hygiene_updated_at BEFORE
update on participant_hygiene_routines for EACH row
execute FUNCTION update_updated_at_column ();

create table public.participant_goals (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  goal_type text not null,
  description text not null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_goals_pkey primary key (id),
  constraint participant_goals_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_goals_participant on public.participant_goals using btree (participant_id) TABLESPACE pg_default;

create index IF not exists idx_goals_active on public.participant_goals using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_goals_type on public.participant_goals using btree (goal_type) TABLESPACE pg_default;

create table public.participant_goal_progress (
  id uuid not null default gen_random_uuid (),
  goal_id uuid not null,
  progress_note text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_goal_progress_pkey primary key (id),
  constraint participant_goal_progress_goal_id_fkey foreign KEY (goal_id) references participant_goals (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_goal_progress_goal on public.participant_goal_progress using btree (goal_id) TABLESPACE pg_default;

create table public.participant_funding (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  house_id uuid null,
  code text null,
  invoice_recipient text null,
  allocated_amount numeric(12, 2) not null,
  used_amount numeric(12, 2) null default 0,
  remaining_amount numeric(12, 2) null,
  status text null default 'Active'::text,
  end_date date null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  funding_source_id uuid null,
  funding_type_id uuid null,
  constraint participant_funding_pkey primary key (id),
  constraint participant_funding_funding_source_id_fkey foreign KEY (funding_source_id) references funding_sources_master (id) on delete RESTRICT,
  constraint participant_funding_funding_type_id_fkey foreign KEY (funding_type_id) references funding_types_master (id) on delete RESTRICT,
  constraint participant_funding_house_id_fkey foreign KEY (house_id) references houses (id) on delete set null,
  constraint participant_funding_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE,
  constraint participant_funding_status_check check (
    (
      status = any (
        array[
          'Active'::text,
          'Near Depletion'::text,
          'Expired'::text,
          'Inactive'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_participant_funding_source_id on public.participant_funding using btree (funding_source_id) TABLESPACE pg_default;

create index IF not exists idx_participant_funding_type_id on public.participant_funding using btree (funding_type_id) TABLESPACE pg_default;

create table public.participant_forms (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  form_type text not null,
  form_title text not null,
  form_data jsonb null,
  submitted_by uuid null,
  submission_date date null default CURRENT_DATE,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_forms_pkey primary key (id),
  constraint participant_forms_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE,
  constraint participant_forms_submitted_by_fkey foreign KEY (submitted_by) references staff (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_forms_participant on public.participant_forms using btree (participant_id) TABLESPACE pg_default;

create trigger update_participant_forms_updated_at BEFORE
update on participant_forms for EACH row
execute FUNCTION update_updated_at_column ();

create table public.participant_documents (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_size integer null,
  mime_type text null,
  uploaded_by uuid null,
  is_restricted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint participant_documents_pkey primary key (id),
  constraint participant_documents_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE,
  constraint participant_documents_uploaded_by_fkey foreign KEY (uploaded_by) references staff (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_documents_participant on public.participant_documents using btree (participant_id) TABLESPACE pg_default;

create trigger update_participant_documents_updated_at BEFORE
update on participant_documents for EACH row
execute FUNCTION update_updated_at_column ();

create table public.participant_contacts (
  id uuid not null default gen_random_uuid (),
  participant_id uuid not null,
  contact_name text not null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone text null,
  email text null,
  address text null,
  notes text null,
  contact_type_id uuid null,
  constraint participant_providers_pkey primary key (id),
  constraint participant_contacts_contact_type_id_fkey foreign KEY (contact_type_id) references contact_types_master (id) on delete RESTRICT,
  constraint participant_providers_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_contacts_participant on public.participant_contacts using btree (participant_id) TABLESPACE pg_default;

create index IF not exists idx_contacts_active on public.participant_contacts using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_participant_contacts_contact_type_id on public.participant_contacts using btree (contact_type_id) TABLESPACE pg_default;


create table public.staff (
  id uuid not null default gen_random_uuid (),
  name text null,
  email text null,
  phone text null,
  hire_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  date_of_birth text null,
  address text null,
  emergency_contact_name text null,
  emergency_contact_phone text null,
  notes text null,
  branch_id uuid null,
  role_id uuid null,
  status public.status_enum not null default 'draft'::status_enum,
  hobbies text null,
  allergies text null,
  availability text null,
  department_id uuid null,
  employment_type_id uuid null,
  manager_id uuid null,
  ndis_worker_screening_check boolean null default false,
  ndis_worker_screening_check_expiry date null,
  ndis_orientation_module boolean null default false,
  ndis_orientation_module_expiry date null,
  ndis_code_of_conduct boolean null default false,
  ndis_code_of_conduct_expiry date null,
  ndis_infection_control_training boolean null default false,
  ndis_infection_control_training_expiry date null,
  drivers_license boolean null default false,
  drivers_license_expiry date null,
  comprehensive_car_insurance boolean null default false,
  comprehensive_car_insurance_expiry date null,
  separation_date date null,
  auth_user_id uuid null,
  photo_url text null,
  constraint staff_pkey primary key (id),
  constraint staff_auth_user_id_key unique (auth_user_id),
  constraint staff_email_key unique (email),
  constraint staff_manager_id_fkey foreign KEY (manager_id) references staff (id) on delete set null,
  constraint staff_auth_user_id_fkey foreign KEY (auth_user_id) references auth.users (id) on delete set null,
  constraint staff_department_id_fkey foreign KEY (department_id) references departments (id) on delete set null,
  constraint staff_employment_type_id_fkey foreign KEY (employment_type_id) references employment_types_master (id) on delete set null,
  constraint staff_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint staff_name_required_when_active check (
    (
      (status <> 'active'::status_enum)
      or (
        (name is not null)
        and (
          length(
            TRIM(
              both
              from
                name
            )
          ) > 0
        )
      )
    )
  ),
  constraint staff_email_required_when_active check (
    (
      (status <> 'active'::status_enum)
      or (email is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_staff_email on public.staff using btree (email) TABLESPACE pg_default;

create index IF not exists idx_staff_name on public.staff using btree (name) TABLESPACE pg_default;

create index IF not exists idx_staff_branch_id on public.staff using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_staff_role_id on public.staff using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_staff_status on public.staff using btree (status) TABLESPACE pg_default;

create index IF not exists idx_staff_department_id on public.staff using btree (department_id) TABLESPACE pg_default;

create index IF not exists idx_staff_employment_type_id on public.staff using btree (employment_type_id) TABLESPACE pg_default;

create index IF not exists idx_staff_manager_id on public.staff using btree (manager_id) TABLESPACE pg_default;

create index IF not exists idx_staff_auth_user_id on public.staff using btree (auth_user_id) TABLESPACE pg_default;

create table public.staff_compliance (
  id uuid not null default gen_random_uuid (),
  staff_id uuid not null,
  compliance_name text not null,
  completion_date date null,
  expiry_date date null,
  status text null default 'Complete'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_compliance_pkey primary key (id),
  constraint staff_compliance_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE,
  constraint staff_compliance_status_check check (
    (
      status = any (
        array[
          'Complete'::text,
          'Expiring Soon'::text,
          'Expired'::text,
          'Incomplete'::text,
          'Not Required'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_staff_compliance_staff_id on public.staff_compliance using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_staff_compliance_status on public.staff_compliance using btree (status) TABLESPACE pg_default;

create index IF not exists idx_staff_compliance_expiry_date on public.staff_compliance using btree (expiry_date) TABLESPACE pg_default;

create trigger trigger_update_compliance_status BEFORE INSERT
or
update on staff_compliance for EACH row
execute FUNCTION update_compliance_status ();

create table public.staff_documents (
  id uuid not null default gen_random_uuid (),
  staff_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_size integer null,
  mime_type text null,
  uploaded_by text null,
  is_restricted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_documents_pkey primary key (id),
  constraint staff_documents_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_staff_documents_staff_id on public.staff_documents using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_staff_documents_created_at on public.staff_documents using btree (created_at desc) TABLESPACE pg_default;

create table public.staff_shifts (
  id uuid not null default extensions.uuid_generate_v4 (),
  staff_id uuid not null,
  shift_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  house_id uuid null,
  shift_type character varying(50) not null default 'SIL'::character varying,
  status character varying(50) not null default 'Scheduled'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  end_date date not null default CURRENT_DATE,
  constraint staff_shifts_pkey primary key (id),
  constraint staff_shifts_house_id_fkey foreign KEY (house_id) references houses (id) on delete set null,
  constraint staff_shifts_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_staff_shifts_staff_id on public.staff_shifts using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_staff_shifts_date on public.staff_shifts using btree (shift_date) TABLESPACE pg_default;

create index IF not exists idx_staff_shifts_house_id on public.staff_shifts using btree (house_id) TABLESPACE pg_default;

create table public.staff_training (
  id uuid not null default extensions.uuid_generate_v4 (),
  staff_id uuid null,
  title text not null,
  category text not null,
  description text null,
  provider text null,
  date_completed date null,
  expiry_date date null,
  file_path text null,
  file_name text null,
  file_size integer null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint staff_training_pkey primary key (id),
  constraint staff_training_created_by_fkey foreign KEY (created_by) references staff (id),
  constraint staff_training_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_staff_training_staff_id on public.staff_training using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_staff_training_expiry_date on public.staff_training using btree (expiry_date) TABLESPACE pg_default;

create index IF not exists idx_staff_training_created_at on public.staff_training using btree (created_at desc) TABLESPACE pg_default;

create table public.roles (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text null,
  permissions text[] null default '{}'::text[],
  assigned_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint roles_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_roles_name on public.roles using btree (name) TABLESPACE pg_default;


create table public.houses (
  id uuid not null default gen_random_uuid (),
  name text not null,
  branch_id uuid null,
  address text null,
  phone text null,
  capacity integer null default 0,
  current_occupancy integer null default 0,
  house_manager text null,
  status text null default 'active'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint houses_pkey primary key (id),
  constraint houses_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint houses_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'maintenance'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_houses_branch_id on public.houses using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_houses_name on public.houses using btree (name) TABLESPACE pg_default;

create index IF not exists idx_houses_status on public.houses using btree (status) TABLESPACE pg_default;

create table public.house_staff_assignments (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid not null,
  staff_id uuid not null,
  is_primary boolean null default false,
  start_date date null,
  end_date date null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_staff_assignments_pkey primary key (id),
  constraint house_staff_assignments_house_id_staff_id_key unique (house_id, staff_id),
  constraint house_staff_assignments_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE,
  constraint house_staff_assignments_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_staff_house_id on public.house_staff_assignments using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_staff_staff_id on public.house_staff_assignments using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_house_staff_is_primary on public.house_staff_assignments using btree (is_primary) TABLESPACE pg_default;

create trigger update_house_staff_assignments_updated_at BEFORE
update on house_staff_assignments for EACH row
execute FUNCTION update_updated_at_column ();

create table public.house_resources (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid null,
  title text not null,
  category text not null,
  type text not null,
  description text null,
  priority text null default 'Medium'::text,
  phone text null,
  address text null,
  file_url text null,
  file_name text null,
  file_size integer null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_resources_pkey primary key (id),
  constraint house_resources_created_by_fkey foreign KEY (created_by) references staff (id),
  constraint house_resources_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_resources_house_id on public.house_resources using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_resources_category on public.house_resources using btree (category) TABLESPACE pg_default;

create index IF not exists idx_house_resources_type on public.house_resources using btree (type) TABLESPACE pg_default;

create index IF not exists idx_house_resources_priority on public.house_resources using btree (priority) TABLESPACE pg_default;

create trigger update_house_resources_updated_at BEFORE
update on house_resources for EACH row
execute FUNCTION update_updated_at_column ();

create table public.house_resources (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid null,
  title text not null,
  category text not null,
  type text not null,
  description text null,
  priority text null default 'Medium'::text,
  phone text null,
  address text null,
  file_url text null,
  file_name text null,
  file_size integer null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_resources_pkey primary key (id),
  constraint house_resources_created_by_fkey foreign KEY (created_by) references staff (id),
  constraint house_resources_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_resources_house_id on public.house_resources using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_resources_category on public.house_resources using btree (category) TABLESPACE pg_default;

create index IF not exists idx_house_resources_type on public.house_resources using btree (type) TABLESPACE pg_default;

create index IF not exists idx_house_resources_priority on public.house_resources using btree (priority) TABLESPACE pg_default;

create trigger update_house_resources_updated_at BEFORE
update on house_resources for EACH row
execute FUNCTION update_updated_at_column ();

create table public.house_form_submissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  form_id uuid null,
  assignment_id uuid null,
  submitted_by uuid null,
  participant_id uuid null,
  submission_data jsonb null,
  status text null default 'complete'::text,
  submitted_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_form_submissions_pkey primary key (id),
  constraint house_form_submissions_assignment_id_fkey foreign KEY (assignment_id) references house_form_assignments (id) on delete set null,
  constraint house_form_submissions_form_id_fkey foreign KEY (form_id) references house_forms (id) on delete CASCADE,
  constraint house_form_submissions_participant_id_fkey foreign KEY (participant_id) references participants (id),
  constraint house_form_submissions_submitted_by_fkey foreign KEY (submitted_by) references staff (id)
) TABLESPACE pg_default;

create index IF not exists idx_house_form_submissions_form_id on public.house_form_submissions using btree (form_id) TABLESPACE pg_default;

create index IF not exists idx_house_form_submissions_submitted_by on public.house_form_submissions using btree (submitted_by) TABLESPACE pg_default;

create trigger update_house_form_submissions_updated_at BEFORE
update on house_form_submissions for EACH row
execute FUNCTION update_updated_at_column ();

create table public.house_form_assignments (
  id uuid not null default extensions.uuid_generate_v4 (),
  form_id uuid null,
  participant_id uuid null,
  staff_id uuid null,
  assigned_by uuid null,
  due_date date null,
  status text null default 'pending'::text,
  completed_at timestamp with time zone null,
  completed_by uuid null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_form_assignments_pkey primary key (id),
  constraint house_form_assignments_assigned_by_fkey foreign KEY (assigned_by) references staff (id),
  constraint house_form_assignments_completed_by_fkey foreign KEY (completed_by) references staff (id),
  constraint house_form_assignments_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE,
  constraint house_form_assignments_form_id_fkey foreign KEY (form_id) references house_forms (id) on delete CASCADE,
  constraint house_form_assignments_staff_id_fkey foreign KEY (staff_id) references staff (id) on delete CASCADE,
  constraint assignment_target_check check (
    (
      (
        (participant_id is not null)
        and (staff_id is null)
      )
      or (
        (participant_id is null)
        and (staff_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_house_form_assignments_form_id on public.house_form_assignments using btree (form_id) TABLESPACE pg_default;

create index IF not exists idx_house_form_assignments_participant_id on public.house_form_assignments using btree (participant_id) TABLESPACE pg_default;

create index IF not exists idx_house_form_assignments_staff_id on public.house_form_assignments using btree (staff_id) TABLESPACE pg_default;

create index IF not exists idx_house_form_assignments_status on public.house_form_assignments using btree (status) TABLESPACE pg_default;

create trigger update_house_form_assignments_updated_at BEFORE
update on house_form_assignments for EACH row
execute FUNCTION update_updated_at_column ();

create table public.house_files (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid null,
  file_name text not null,
  file_path text not null,
  file_size bigint null,
  file_type text null,
  category text null,
  version text null,
  status text null default 'current'::text,
  uploaded_by text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_files_pkey primary key (id),
  constraint house_files_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_files_house_id on public.house_files using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_files_status on public.house_files using btree (status) TABLESPACE pg_default;

create index IF not exists idx_house_files_category on public.house_files using btree (category) TABLESPACE pg_default;

create trigger update_house_files_updated_at BEFORE
update on house_files for EACH row
execute FUNCTION update_house_files_updated_at ();

create table public.house_checklists (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid null,
  name text not null,
  frequency text not null,
  description text null,
  is_global boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_checklists_pkey primary key (id),
  constraint house_checklists_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_checklists_house_id on public.house_checklists using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_checklists_frequency on public.house_checklists using btree (frequency) TABLESPACE pg_default;

create trigger update_house_checklists_updated_at BEFORE
update on house_checklists for EACH row
execute FUNCTION update_house_checklists_updated_at ();

create table public.house_checklist_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  checklist_id uuid null,
  title text not null,
  instructions text null,
  priority text null default 'medium'::text,
  is_required boolean null default true,
  sort_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_checklist_items_pkey primary key (id),
  constraint house_checklist_items_checklist_id_fkey foreign KEY (checklist_id) references house_checklists (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_checklist_items_checklist_id on public.house_checklist_items using btree (checklist_id) TABLESPACE pg_default;

create index IF not exists idx_house_checklist_items_sort_order on public.house_checklist_items using btree (checklist_id, sort_order) TABLESPACE pg_default;

create trigger update_house_checklist_items_updated_at BEFORE
update on house_checklist_items for EACH row
execute FUNCTION update_house_checklist_items_updated_at ();

create table public.house_calendar_events (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid null,
  title text not null,
  type text not null,
  description text null,
  event_date date not null,
  start_time time without time zone null,
  end_time time without time zone null,
  participant_id uuid null,
  assigned_staff_id uuid null,
  status text null default 'scheduled'::text,
  location text null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_calendar_events_pkey primary key (id),
  constraint house_calendar_events_assigned_staff_id_fkey foreign KEY (assigned_staff_id) references staff (id) on delete set null,
  constraint house_calendar_events_created_by_fkey foreign KEY (created_by) references staff (id),
  constraint house_calendar_events_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE,
  constraint house_calendar_events_participant_id_fkey foreign KEY (participant_id) references participants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_calendar_events_house_id on public.house_calendar_events using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_calendar_events_date on public.house_calendar_events using btree (event_date) TABLESPACE pg_default;

create index IF not exists idx_house_calendar_events_type on public.house_calendar_events using btree (type) TABLESPACE pg_default;

create index IF not exists idx_house_calendar_events_participant_id on public.house_calendar_events using btree (participant_id) TABLESPACE pg_default;

create index IF not exists idx_house_calendar_events_assigned_staff_id on public.house_calendar_events using btree (assigned_staff_id) TABLESPACE pg_default;

create index IF not exists idx_house_calendar_events_status on public.house_calendar_events using btree (status) TABLESPACE pg_default;

create trigger update_house_calendar_events_updated_at BEFORE
update on house_calendar_events for EACH row
execute FUNCTION update_updated_at_column ();

create table public.house_forms (
  id uuid not null default extensions.uuid_generate_v4 (),
  house_id uuid null,
  name text not null,
  type text not null,
  description text null,
  frequency text not null,
  is_global boolean null default false,
  status text null default 'active'::text,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_forms_pkey primary key (id),
  constraint house_forms_created_by_fkey foreign KEY (created_by) references staff (id),
  constraint house_forms_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_house_forms_house_id on public.house_forms using btree (house_id) TABLESPACE pg_default;

create index IF not exists idx_house_forms_type on public.house_forms using btree (type) TABLESPACE pg_default;

create index IF not exists idx_house_forms_status on public.house_forms using btree (status) TABLESPACE pg_default;

create trigger update_house_forms_updated_at BEFORE
update on house_forms for EACH row
execute FUNCTION update_updated_at_column ();
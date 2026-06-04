import { TABLES } from './db-tables';

/**
 * Centralized Supabase .select() query strings (Views).
 * 
 * Rules:
 * 1. Always use the TABLES constant for join aliases to ensure consistency.
 * 2. Use explicit foreign key hints (e.g., !created_by) to prevent ambiguity.
 * 3. Document the purpose of each view.
 * 4. Self-Join Exception: Use the column name as the hint (e.g., !manager_id).
 */
export const PARTICIPANT_VIEWS = {
  /**
   * Minimal view for lists and tables.
   */
  LIST: `
    id,
    participant_name,
    photo_url,
    email,
    personal_mobile,
    status,
    house_id,
    move_in_date,
    ndis_number,
    date_of_birth,
    houses:${TABLES.HOUSES}!house_id (
      house_name
    )
  `,
  /**
   * Comprehensive view for detail pages and forms.
   */
  DETAIL: `
    id, 
    participant_name, 
    photo_url, 
    email, 
    house_phone, 
    personal_mobile, 
    address, 
    date_of_birth, 
    move_in_date, 
    ndis_number, 
    house_id, 
    status, 
    support_level, 
    support_coordinator, 
    primary_diagnosis, 
    secondary_diagnosis, 
    allergies, 
    routine, 
    hygiene_support, 
    current_goals, 
    current_medications, 
    restrictive_practices, 
    service_providers, 
    behaviour_of_concern, 
    pbsp_engaged, 
    bsp_available, 
    restrictive_practices_yn, 
    specialist_name, 
    specialist_phone, 
    specialist_email, 
    restrictive_practice_authorisation, 
    restrictive_practice_details, 
    mtmp_required, 
    mtmp_details, 
    mobility_support, 
    meal_prep_support, 
    household_support, 
    communication_type, 
    communication_notes, 
    communication_language_needs, 
    finance_support, 
    health_wellbeing_support, 
    cultural_religious_support, 
    other_support, 
    mental_health_plan, 
    medical_plan, 
    natural_disaster_plan, 
    pharmacy_name, 
    pharmacy_contact, 
    pharmacy_location, 
    gp_name, 
    gp_contact, 
    gp_location, 
    psychiatrist_name, 
    psychiatrist_contact, 
    psychiatrist_location, 
    medical_routine_other, 
    medical_routine_general_process, 
    created_by, 
    updated_by, 
    created_at, 
    updated_at,
    houses:${TABLES.HOUSES}!house_id (
      house_name
    )
  `,

  /**
   * View for participant goals.
   */
  GOALS: 'id, participant_id, goal_type, description, created_at, updated_at',

  /**
   * View for participant medications.
   */
  MEDICATIONS: `
    id, 
    participant_id, 
    medication_id, 
    dosage, 
    is_active, 
    created_at, 
    updated_at,
    medication_info:${TABLES.MEDICATIONS_MASTER}!medication_id(
      id, 
      medication_name, 
      brand_name,
      medication_type:${TABLES.MEDICATION_TYPES_MASTER}!type_id(id, medication_type_name)
    )
  `,

  /**
   * View for participant contacts.
   */
  CONTACTS: `
    id, 
    participant_id, 
    contact_name, 
    contact_type_id, 
    phone, 
    email, 
    address, 
    notes, 
    is_active, 
    created_at, 
    updated_at,
    contact_type_info:${TABLES.CONTACT_TYPES_MASTER}!contact_type_id(id, contact_type_name)
  `,

  /**
   * View for participant funding.
   */
  FUNDING: `
    id, 
    participant_id, 
    funding_source_id, 
    funding_type_id, 
    start_date, 
    end_date, 
    total_budget, 
    remaining_budget, 
    notes, 
    created_at, 
    updated_at,
    funding_source_info:${TABLES.FUNDING_SOURCES_MASTER}!funding_source_id(id, funding_source_name),
    funding_type_info:${TABLES.FUNDING_TYPES_MASTER}!funding_type_id(id, funding_type_name)
  `,

  /**
   * View for participant documents.
   */
  DOCUMENTS: `
    id, 
    participant_id, 
    file_name, 
    file_path, 
    file_size, 
    mime_type, 
    created_at, 
    updated_at,
    uploader_info:${TABLES.STAFF}!created_by(id, staff_name)
  `,
} as const;

export const STAFF_VIEWS = {
  /**
   * Minimal view for staff lists and tables.
   */
  LIST: `
    id, staff_name, email, phone, status, branch_id, role_id, photo_url, auth_user_id,
    created_at, updated_at,
    department_info:${TABLES.DEPARTMENTS}!department_id(id, department_name),
    employment_type_info:${TABLES.EMPLOYMENT_TYPES_MASTER}!employment_type_id(id, employment_type_name),
    role:${TABLES.ROLES}!role_id(id, role_name, description),
    house_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!staff_id(
      id,
      house_id,
      house:${TABLES.HOUSES}!house_id(id, house_name)
    )
  `,

  /**
   * Full detail view for staff profiles.
   */
  DETAIL: `
    id, staff_name, email, phone, date_of_birth, address, hobbies, allergies, 
    emergency_contact_name, emergency_contact_phone, department_id, 
    employment_type_id, manager_id, hire_date, separation_date, 
    availability, notes, branch_id, role_id, status, auth_user_id, created_by, updated_by, created_at, updated_at, 
    ndis_worker_screening_check, ndis_worker_screening_check_expiry, 
    ndis_orientation_module, ndis_orientation_module_expiry, 
    ndis_code_of_conduct, ndis_code_of_conduct_expiry, 
    ndis_infection_control_training, ndis_infection_control_training_expiry, 
    drivers_license, drivers_license_expiry, comprehensive_car_insurance, 
    comprehensive_car_insurance_expiry, photo_url,
    department_info:${TABLES.DEPARTMENTS}!department_id(id, department_name),
    employment_type_info:${TABLES.EMPLOYMENT_TYPES_MASTER}!employment_type_id(id, employment_type_name),
    role:${TABLES.ROLES}!role_id(id, role_name, description),
    manager_info:${TABLES.STAFF}!manager_id(id, staff_name)
  `,

  /**
   * View for staff compliance records.
   */
  COMPLIANCE: 'id, staff_id, compliance_name, completion_date, expiry_date, status, created_at, updated_at',

  /**
   * View for staff training records.
   */
  TRAINING: 'id, staff_id, title, category, description, provider, date_completed, expiry_date, file_path, created_at, updated_at',

  /**
   * View for staff documents.
   */
  DOCUMENTS: `
    id, 
    staff_id, 
    file_name, 
    file_path, 
    file_size, 
    mime_type, 
    created_at, 
    updated_at,
    uploader_info:${TABLES.STAFF}!created_by(id, staff_name)
  `,
} as const;

export const HOUSE_VIEWS = {
  /**
   * Standard view for house lists and details.
   */
  STANDARD: `
    id, house_name, branch_id, address, phone, capacity, current_occupancy, house_manager, status, notes, 
    individuals_breakdown, participant_dynamics, observations, general_house_details, risk_management, 
    created_by, updated_by, created_at, updated_at,
    checklists:${TABLES.HOUSE_CHECKLISTS}!house_id(count), 
    staff_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!house_id(
      id, 
      end_date,
      staff:${TABLES.STAFF}!staff_id(id, staff_name, photo_url, status)
    )
  `,

  /**
   * View for house forms.
   */
  FORMS: `
    id, house_id, form_name, form_url, category, status, created_at, updated_at
  `,

  /**
   * View for house resources and documentation.
   */
  RESOURCES: `
    id, house_id, title, category, type, description, priority, phone, address, notes, file_url, file_name, file_size, is_active, created_at, updated_at
  `,

  /**
   * View for house communications/logs.
   */
  COMMS: `
    id, house_id, created_by, content, entry_date, created_at, updated_at,
    creator:${TABLES.STAFF}!created_by(id, staff_name)
  `,

  /**
   * View for house files (Storage links).
   */
  FILES: `
    id, house_id, file_name, file_path, file_size, mime_type, category, created_at, updated_at,
    uploader_info:${TABLES.STAFF}!created_by(id, staff_name)
  `,
} as const;

export const ROSTER_VIEWS = {
  /**
   * Comprehensive shift view with relations for the roster board.
   */
  SHIFT_DETAIL: `
    id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_template, shift_template_id, notes,
    staff_info:${TABLES.STAFF}!staff_id(id, staff_name, photo_url),
    house_info:${TABLES.HOUSES}!house_id(id, house_name),
    type_details:${TABLES.HOUSE_SHIFT_TEMPLATES}!shift_template_id(color_theme, icon_name),
    participants:${TABLES.SHIFT_PARTICIPANTS}!shift_id(
      participant:${TABLES.PARTICIPANTS}!participant_id(id, participant_name, photo_url)
    ),
    assigned_checklists:${TABLES.SHIFT_ASSIGNED_CHECKLISTS}!shift_id(
      id, checklist_id, assignment_title,
      submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}!shift_assignment_id(status),
      checklist:${TABLES.HOUSE_CHECKLISTS}!checklist_id(
        house_checklist_name,
        items:${TABLES.HOUSE_CHECKLIST_ITEMS}!checklist_id(id, title, sort_order)
      )
    ),
    notes_count:${TABLES.SHIFT_NOTES}!shift_id(count)
  `,

  /**
   * Minimal shift view for staff profiles or simple lists.
   */
  SHIFT_LIST: `
    id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_template, shift_template_id, notes,
    house:${TABLES.HOUSES}!house_id(id, house_name)
  `,

  /**
   * Leave request view with type info.
   */
  LEAVE_LIST: `
    id, start_date, end_date, status, staff_id, reason, admin_notes, created_at, attachment_url,
    leave_type:${TABLES.LEAVE_TYPES}!leave_type_id(leave_type_name)
  `,
} as const;

export const CHECKLIST_VIEWS = {
  /**
   * Checklist template with its items and group info.
   */
  WITH_ITEMS: `
    id, house_id, house_checklist_name, days_of_week, description, master_id, sort_order, created_at, updated_at,
    house_checklist_items:${TABLES.HOUSE_CHECKLIST_ITEMS}!checklist_id(
      id, checklist_id, title, instructions, group_id, group_title, priority, is_required, sort_order, created_at, updated_at,
      group:${TABLES.HOUSE_SHIFT_TEMPLATES}!group_id(id, shift_template_name, short_name, color_theme)
    )
  `,

  /**
   * View for checklist history table.
   */
  HISTORY: `
    id, checklist_id, house_id, submitted_by, status, scheduled_date, started_at, completed_at, created_at, updated_at,
    house_checklists:${TABLES.HOUSE_CHECKLISTS}(house_checklist_name),
    staff:${TABLES.STAFF}!house_checklist_submissions_submitted_by_fkey(id, staff_name, photo_url),
    houses:${TABLES.HOUSES}(id, house_name),
    ic_house_checklist_submission_items:ic_house_checklist_submission_items(is_completed)
  `,

  /**
   * Minimal submission view.
   */
  SUBMISSION_LIST: `
    id, checklist_id, status, updated_at, scheduled_date
  `,

  /**
   * Full submission view with items and staff info.
   */
  SUBMISSION_DETAIL: `
    *,
    ${TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS}:${TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS}!submission_id(
      id, 
      submission_id, 
      item_id, 
      status, 
      is_completed, 
      note, 
      completed_at,
      completed_by_staff:${TABLES.STAFF}!completed_by(id, staff_name)
    )
  `,
} as const;


export const SHIFT_NOTE_VIEWS = {
  /**
   * Comprehensive shift note view with all relations.
   */
  DETAIL: `
    id, 
    participant_id, 
    staff_id, 
    start_date, 
    shift_time, 
    house_id, 
    shift_id, 
    notes, 
    full_note, 
    status,
    shift_type,
    risks_observed,
    risk_description,
    overall_presentation,
    adl_supports,
    domestic_tasks,
    capacity_building_goals,
    regular_medication_status,
    prn_medication_given,
    prn_description,
    pbs_strategies_used,
    pbs_strategies_details,
    pbs_when_used,
    pbs_outcome,
    restrictive_practices_status,
    shift_summary,
    bowel_movement_occurred,
    bowel_time,
    bowel_bristol_scale,
    bowel_amount,
    bowel_assistance_required,
    bowel_notes,
    seizure_occurred,
    seizure_time_started,
    seizure_duration_minutes,
    seizure_type_id,
    seizure_description,
    seizure_injury_occurred,
    seizure_injury_description,
    seizure_emergency_services,
    seizure_notes,
    sleep_occurred,
    sleep_type_period,
    sleep_start_time,
    sleep_wake_time,
    sleep_quality,
    sleep_support_required,
    behaviour_observed,
    behaviour_type_id,
    behaviour_intensity,
    behaviour_notes,
    community_access_occurred,
    community_activity_type,
    community_location,
    community_engagement_level,
    community_notes,
    meal_provided,
    nutrition_meal_type,
    nutrition_intake,
    nutrition_refusal_alternatives,
    nutrition_assistance_needed,
    nutrition_fluids_intake,
    nutrition_notes,
    mtm_meal_provided,
    mtm_diet_type,
    mtm_fluids,
    mtm_texture_correct,
    mtm_consistency_correct,
    mtm_positioning_appropriate,
    mtm_supervision_required,
    mtm_swallowing_concerns,
    mtm_meal_intake,
    mtm_meal_intake_notes,
    mtm_fluid_intake,
    mtm_fluid_intake_notes,
    mtm_concerns,
    mtm_notes,
    hygiene_support_required,
    hygiene_shower,
    hygiene_oral_care,
    hygiene_toileting,
    hygiene_grooming,
    hygiene_observed_concerns,
    hygiene_notes,
    created_at, 
    updated_at,
    participant:${TABLES.PARTICIPANTS}!participant_id(id, participant_name, photo_url),
    staff:${TABLES.STAFF}!staff_id(id, staff_name, photo_url),
    house:${TABLES.HOUSES}!house_id(id, house_name),
    shift:${TABLES.STAFF_SHIFTS}!shift_id(
      id, 
      start_time, 
      end_time, 
      shift_template,
      participants:${TABLES.SHIFT_PARTICIPANTS}!shift_id(
        participant:${TABLES.PARTICIPANTS}!participant_id(id, participant_name)
      )
    )
  `,
} as const;

export const INCIDENT_VIEWS = {
  /**
   * Comprehensive incident report view with all involved parties.
   */
  DETAIL: `
    *,
    participant:${TABLES.PARTICIPANTS}!involved_participant_id(id, participant_name, photo_url),
    staff:${TABLES.STAFF}!involved_staff_id(id, staff_name, photo_url),
    reporter:${TABLES.STAFF}!reported_by(id, staff_name, photo_url),
    house:${TABLES.HOUSES}!house_id(id, house_name)
  `,
} as const;

export const ACTIVITY_VIEWS = {
  /**
   * Detailed activity log view.
   */
  DETAIL: `
    id, activity_type, entity_type, entity_id, entity_name, description, user_name, user_id, table_name, parent_name, parent_type, metadata, created_at,
    staff:${TABLES.STAFF}!user_id(id, staff_name, photo_url)
  `,

  /**
   * Minimal activity log view for lists.
   */
  LIST: `
    id, activity_type, entity_type, entity_id, entity_name, description, user_name, user_id, table_name, parent_name, parent_type, created_at,
    staff:${TABLES.STAFF}!user_id(id, staff_name, photo_url)
  `,
} as const;

export const MEDICATION_VIEWS = {
  /**
   * Standard medication master view.
   */
  STANDARD: `
    id, 
    medication_name, 
    brand_name,
    type_id,
    sub_class,
    purpose,
    contraindications,
    side_effects, 
    interactions, 
    is_active, 
    created_by, 
    updated_by, 
    created_at, 
    updated_at,
    medication_type:${TABLES.MEDICATION_TYPES_MASTER}!type_id(id, medication_type_name)
  `,
} as const;

export const MASTER_LIST_VIEWS = {
  /**
   * View for simple master lists (Name + Timestamps).
   */
  STANDARD: 'id, name, created_at, updated_at',
  
  /**
   * View for contact types.
   */
  CONTACT_TYPES: 'id, contact_type_name, is_active, created_by, updated_by, created_at, updated_at',

  /**
   * View for employment types.
   */
  EMPLOYMENT_TYPES: 'id, employment_type_name, status, created_at, updated_at',

  /**
   * View for departments.
   */
  DEPARTMENTS: 'id, department_name, description, status, created_at, updated_at',

  /**
   * View for funding sources.
   */
  FUNDING_SOURCES: 'id, funding_source_name, is_active, created_at, updated_at',

  /**
   * View for funding types.
   */
  FUNDING_TYPES: 'id, funding_type_name, is_active, created_at, updated_at',
} as const;

export const CALENDAR_VIEWS = {
  /**
   * View for calendar events with house and type info.
   */
  STANDARD: `
    id, 
    title, 
    event_date, 
    start_time, 
    end_time, 
    location, 
    type:${TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER}!event_type_id(event_type_name, color),
    house_id,
    house:${TABLES.HOUSES}!house_id(house_name),
    staff_assignments:${TABLES.HOUSE_CALENDAR_EVENT_STAFF}!event_id(staff_id)
  `,

  /**
   * Comprehensive detail view for calendar events.
   */
  DETAIL: `
    *,
    type:${TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER}!event_type_id(event_type_name, color),
    house:${TABLES.HOUSES}!house_id(id, house_name),
    staff_assignments:${TABLES.HOUSE_CALENDAR_EVENT_STAFF}!event_id(
      id, staff_id, staff:${TABLES.STAFF}!staff_id(id, staff_name)
    ),
    participants:${TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS}!event_id(
      id, participant_id, participant:${TABLES.PARTICIPANTS}!participant_id(id, participant_name)
    ),
    attachments:${TABLES.HOUSE_CALENDAR_EVENT_ATTACHMENTS}!event_id(
      id, file_name, file_path, file_size
    )
  `,

  /**
   * Comprehensive list view for calendar with submissions and nested data.
   */
  FULL_LIST: `
    id, house_id, title, event_type_id, description, event_date, start_time, end_time, status, location, 
    created_by, created_at, updated_at, is_checklist_event, house_checklist_id, checklist_schedule_id,
    type:${TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER}!event_type_id(event_type_name, color),
    attachments:${TABLES.HOUSE_CALENDAR_EVENT_ATTACHMENTS}!event_id(*),
    creator:${TABLES.STAFF}!created_by(id, staff_name, email),
    submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}!calendar_event_id(
      id, status, completed_at,
      items:${TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS}!submission_id(
        id, item_id, status, is_completed, note, 
        completed_by_staff:${TABLES.STAFF}!completed_by(id, staff_name)
      )
    ),
    event_participants:${TABLES.HOUSE_CALENDAR_EVENT_PARTICIPANTS}!event_id(
      participant:${TABLES.PARTICIPANTS}!participant_id(id, participant_name)
    ),
    event_staff:${TABLES.HOUSE_CALENDAR_EVENT_STAFF}!event_id(
      staff:${TABLES.STAFF}!staff_id(id, staff_name)
    )
  `,

  /**
   * View for checklist-specific calendar events.
   */
  CHECKLIST_EVENT: `
    id, 
    house_id, 
    title, 
    event_date, 
    is_checklist_event, 
    house_checklist_id, 
    status,
    submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}!calendar_event_id(
      id, 
      status, 
      updated_at, 
      scheduled_date
    )
  `,
} as const;

export const MISC_VIEWS = {
  /**
   * View for current shift checks.
   */
  CURRENT_SHIFT: `id, staff_id, house_id, start_date, start_time, end_date, end_time, house:${TABLES.HOUSES}!house_id(id, house_name)`,
  
  /**
   * View for staff by role list.
   */
  STAFF_BY_ROLE: `
    id, staff_name, email, status, photo_url,
    department_info:${TABLES.DEPARTMENTS}!department_id(id, department_name)
  `,
} as const;

export const SYSTEM_VIEWS = {
  /**
   * View for user notifications.
   */
  NOTIFICATIONS: `
    id, user_id, title, message, status, category, metadata, created_at, read_at
  `,

  /**
   * View for role permissions.
   */
  PERMISSIONS: `
    id, role_id, module_name, access_level,
    role_info:${TABLES.ROLES}!role_id(id, role_name)
  `,
} as const;

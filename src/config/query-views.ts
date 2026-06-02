import { TABLES } from './db-tables';

/**
 * Centralized Supabase .select() query strings (Views).
 * 
 * Rules:
 * 1. Always use the TABLES constant for join aliases to ensure consistency.
 * 2. Use explicit foreign key hints (e.g., !participants_house_id_fkey) to prevent ambiguity.
 * 3. Document the purpose of each view.
 */
export const PARTICIPANT_VIEWS = {
  /**
   * Minimal view for lists and tables.
   */
  LIST: `
    id, 
    participant_name, 
    photo_url, 
    status, 
    house_id, 
    ndis_number, 
    date_of_birth,
    houses:${TABLES.HOUSES}!participants_house_id_fkey (
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
    houses:${TABLES.HOUSES}!participants_house_id_fkey (
      house_name
    )
  `,
} as const;

export const STAFF_VIEWS = {
  /**
   * Minimal view for staff lists and tables.
   */
  LIST: `
    id, staff_name, email, phone, status, branch_id, role_id, photo_url, auth_user_id,
    created_at, updated_at,
    department_info:${TABLES.DEPARTMENTS}!staff_department_id_fkey(id, department_name),
    employment_type_info:${TABLES.EMPLOYMENT_TYPES_MASTER}!staff_employment_type_id_fkey(id, employment_type_name),
    role:${TABLES.ROLES}!staff_role_id_fkey(id, role_name, description),
    house_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!house_staff_assignments_staff_id_fkey(
      id,
      house_id,
      house:${TABLES.HOUSES}(id, house_name)
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
    department_info:${TABLES.DEPARTMENTS}!staff_department_id_fkey(id, department_name),
    employment_type_info:${TABLES.EMPLOYMENT_TYPES_MASTER}!staff_employment_type_id_fkey(id, employment_type_name),
    role:${TABLES.ROLES}!staff_role_id_fkey(id, role_name, description),
    manager_info:${TABLES.STAFF}!manager_id(id, staff_name)
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
    checklists:${TABLES.HOUSE_CHECKLISTS}(count), 
    staff_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!house_staff_assignments_staff_id_fkey(
      id, 
      end_date,
      staff:${TABLES.STAFF}!house_staff_assignments_staff_id_fkey(status)
    )
  `,
} as const;

export const ROSTER_VIEWS = {
  /**
   * Comprehensive shift view with relations for the roster board.
   */
  SHIFT_DETAIL: `
    id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_template, shift_template_id, notes,
    staff_info:${TABLES.STAFF}!staff_shifts_staff_id_fkey(id, staff_name),
    house_info:${TABLES.HOUSES}(id, house_name),
    type_details:${TABLES.HOUSE_SHIFT_TEMPLATES}(color_theme, icon_name),
    participants:${TABLES.SHIFT_PARTICIPANTS}(
      participant:${TABLES.PARTICIPANTS}(id, participant_name)
    ),
    assigned_checklists:${TABLES.SHIFT_ASSIGNED_CHECKLISTS}(
      id, checklist_id, assignment_title,
      submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}(status),
      checklist:${TABLES.HOUSE_CHECKLISTS}(
        house_checklist_name,
        items:${TABLES.HOUSE_CHECKLIST_ITEMS}(id, title, sort_order)
      )
    ),
    notes_count:${TABLES.SHIFT_NOTES}(count)
  `,

  /**
   * Minimal shift view for staff profiles or simple lists.
   */
  SHIFT_LIST: `
    id, staff_id, start_date, end_date, start_time, end_time, house_id, shift_template, shift_template_id, notes,
    house:${TABLES.HOUSES}(id, house_name)
  `,

  /**
   * Leave request view with type info.
   */
  LEAVE_LIST: `
    id, start_date, end_date, status, staff_id, reason,
    leave_type:${TABLES.LEAVE_TYPES}(leave_type_name)
  `,
} as const;

export const CHECKLIST_VIEWS = {
  /**
   * Checklist template with its items and group info.
   */
  WITH_ITEMS: `
    id, house_id, house_checklist_name, days_of_week, description, master_id, sort_order, created_at, updated_at,
    house_checklist_items:${TABLES.HOUSE_CHECKLIST_ITEMS}(
      id, checklist_id, title, instructions, group_id, group_title, priority, is_required, sort_order, created_at, updated_at,
      group:${TABLES.HOUSE_SHIFT_TEMPLATES}(id, shift_template_name, short_name, color_theme)
    )
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
    ${TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS}:${TABLES.HOUSE_CHECKLIST_SUBMISSION_ITEMS}(
      id, 
      submission_id, 
      item_id, 
      status, 
      is_completed, 
      note, 
      completed_at,
      completed_by_staff:${TABLES.STAFF}!house_checklist_submission_items_completed_by_fkey(id, staff_name)
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
    created_at, 
    updated_at,
    participant:${TABLES.PARTICIPANTS}(id, participant_name),
    staff:${TABLES.STAFF}!shift_notes_staff_id_fkey(id, staff_name),
    house:${TABLES.HOUSES}(id, house_name),
    shift:${TABLES.STAFF_SHIFTS}(id, start_time, end_time, shift_template)
  `,
} as const;

export const INCIDENT_VIEWS = {
  /**
   * Comprehensive incident report view with all involved parties.
   */
  DETAIL: `
    *,
    participant:${TABLES.PARTICIPANTS}!ic_incident_reports_involved_participant_id_fkey(id, participant_name),
    staff:${TABLES.STAFF}!ic_incident_reports_involved_staff_id_fkey(id, staff_name),
    reporter:${TABLES.STAFF}!ic_incident_reports_reported_by_fkey(id, staff_name),
    house:${TABLES.HOUSES}!ic_incident_reports_house_id_fkey(id, house_name)
  `,
} as const;

export const ACTIVITY_VIEWS = {
  /**
   * Detailed activity log view.
   */
  DETAIL: 'id, activity_type, entity_type, entity_id, entity_name, description, user_name, user_id, table_name, parent_name, parent_type, metadata, created_at',
  
  /**
   * Minimal activity log view for lists.
   */
  LIST: 'id, activity_type, entity_type, entity_id, entity_name, description, user_name, user_id, table_name, parent_name, parent_type, created_at',
} as const;

export const MEDICATION_VIEWS = {
  /**
   * Standard medication master view.
   */
  STANDARD: 'id, medication_name, category, common_dosages, side_effects, interactions, is_active, created_by, updated_by, created_at, updated_at',
} as const;

export const MASTER_LIST_VIEWS = {
  /**
   * View for simple master lists (Name + Is Active).
   */
  STANDARD: 'id, name, is_active, created_at, updated_at',
  
  /**
   * View for contact types.
   */
  CONTACT_TYPES: 'id, contact_type_name, is_active, created_by, updated_by, created_at, updated_at',

  /**
   * View for employment types.
   */
  EMPLOYMENT_TYPES: 'id, employment_type_name, is_active, created_at, updated_at',

  /**
   * View for departments.
   */
  DEPARTMENTS: 'id, department_name, is_active, created_at, updated_at',
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
    type:${TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER}(event_type_name, color),
    house_id,
    house:${TABLES.HOUSES}(house_name),
    staff_assignments:${TABLES.HOUSE_CALENDAR_EVENT_STAFF}!inner(staff_id)
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
    submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}(
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
  CURRENT_SHIFT: 'id, staff_id, house_id, start_date, start_time, end_date, end_time, house:ic_houses(id, house_name)',
  
  /**
   * View for staff by role list.
   */
  STAFF_BY_ROLE: `
    id, staff_name, email, status, photo_url,
    department_info:${TABLES.DEPARTMENTS}!staff_department_id_fkey(id, department_name)
  `,
} as const;







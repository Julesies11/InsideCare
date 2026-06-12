/**
 * Centralized database table names.
 * All tables are prefixed with 'ic_' as per project standards.
 */
export const TABLES = {
  // Core Entities
  PARTICIPANTS: 'ic_participants',
  STAFF: 'ic_staff',
  HOUSES: 'ic_houses',
  BRANCHES: 'ic_branches',
  DEPARTMENTS: 'ic_departments',
  ROLES: 'ic_roles',

  // Participant Child Entities
  PARTICIPANT_MEDICATIONS: 'ic_participant_medications',
  PARTICIPANT_GOALS: 'ic_participant_goals',
  PARTICIPANT_GOAL_PROGRESS: 'ic_participant_goal_progress',
  PARTICIPANT_NOTES: 'ic_participant_notes',
  PARTICIPANT_DOCUMENTS: 'ic_participant_documents',
  PARTICIPANT_DOCUMENT_ROLES: 'ic_participant_document_roles',
  PARTICIPANT_CONTACTS: 'ic_participant_contacts',
  PARTICIPANT_FUNDING: 'ic_participant_funding',
  PARTICIPANT_HYGIENE_ROUTINES: 'ic_participant_hygiene_routines',
  PARTICIPANT_RESTRICTIVE_PRACTICES: 'ic_participant_restrictive_practices',

  // House Child Entities
  HOUSE_STAFF_ASSIGNMENTS: 'ic_house_staff_assignments',
  HOUSE_CALENDAR_EVENTS: 'ic_house_calendar_events',
  HOUSE_CALENDAR_EVENT_STAFF: 'ic_house_calendar_event_staff',
  HOUSE_CALENDAR_EVENT_PARTICIPANTS: 'ic_house_calendar_event_participants',
  HOUSE_CALENDAR_EVENT_ATTACHMENTS: 'ic_house_calendar_event_attachments',
  HOUSE_CHECKLISTS: 'ic_house_checklists',
  HOUSE_CHECKLIST_ITEMS: 'ic_house_checklist_items',
  HOUSE_CHECKLIST_SUBMISSIONS: 'ic_house_checklist_submissions',
  HOUSE_CHECKLIST_SUBMISSION_ITEMS: 'ic_house_checklist_submission_items',
  HOUSE_CHECKLIST_ITEM_ATTACHMENTS: 'ic_house_checklist_item_attachments',
  HOUSE_FORMS: 'ic_house_forms',
  HOUSE_FORM_ASSIGNMENTS: 'ic_house_form_assignments',
  HOUSE_RESOURCES: 'ic_house_resources',
  HOUSE_COMMS: 'ic_house_comms',
  HOUSE_SHIFT_TEMPLATES: 'ic_house_shift_templates',
  HOUSE_FILES: 'ic_house_files',

  // Staff Child Entities
  STAFF_COMPLIANCE: 'ic_staff_compliance',
  STAFF_COMPLIANCE_DOCUMENTS: 'ic_staff_compliance_documents',
  STAFF_TRAINING: 'ic_staff_training',
  STAFF_QUALIFICATIONS: 'ic_staff_qualifications',
  STAFF_DOCUMENTS: 'ic_staff_documents',
  STAFF_DOCUMENT_ROLES: 'ic_staff_document_roles',
  STAFF_ONBOARDING: 'ic_staff_onboarding',
  STAFF_SHIFTS: 'ic_staff_shifts',

  // Operations
  SHIFT_PARTICIPANTS: 'ic_shift_participants',
  SHIFT_NOTES: 'ic_shift_notes',
  INCIDENT_REPORTS: 'ic_incident_reports',
  SHIFT_ASSIGNED_CHECKLISTS: 'ic_shift_assigned_checklists',
  SHIFT_TEMPLATE_DEFAULT_CHECKLISTS: 'ic_shift_template_default_checklists',
  TIMESHEETS: 'ic_timesheets',
  LEAVE_REQUESTS: 'ic_leave_requests',
  CHECKLIST_SCHEDULES: 'ic_checklist_schedules',

  // Master Lists
  MEDICATIONS_MASTER: 'ic_medications_master',
  MEDICATION_TYPES_MASTER: 'ic_medication_types_master',
  CONTACT_TYPES_MASTER: 'ic_contact_types_master',
  CHECKLIST_MASTER: 'ic_checklist_master',
  CHECKLIST_ITEM_MASTER: 'ic_checklist_item_master',
  EMPLOYMENT_TYPES_MASTER: 'ic_employment_types_master',
  HOUSE_CALENDAR_EVENT_TYPES_MASTER: 'ic_house_calendar_event_types_master',
  HOUSE_TYPES_MASTER: 'ic_house_types_master',
  FUNDING_SOURCES_MASTER: 'ic_funding_sources_master',
  FUNDING_TYPES_MASTER: 'ic_funding_types_master',
  LEAVE_TYPES: 'ic_leave_types',
  SEIZURE_TYPES_MASTER: 'ic_seizure_types_master',
  BEHAVIOUR_TYPES_MASTER: 'ic_behaviour_types_master',
  INCIDENT_TYPES_MASTER: 'ic_incident_types_master',
  RESTRICTIVE_PRACTICE_TYPES_MASTER: 'ic_restrictive_practice_types_master',
  COMPLIANCE_TYPES_MASTER: 'ic_compliance_types_master',
  ID_DOCUMENT_TYPES: 'ic_id_document_types',
  ONBOARDING_ITEMS_MASTER: 'ic_onboarding_items_master',

  // Clinical Tracker Master Lists
  SLEEP_QUALITY_MASTER: 'ic_sleep_quality_master',
  SLEEP_TYPES_MASTER: 'ic_sleep_types_master',
  BEHAVIOUR_INTENSITY_MASTER: 'ic_behaviour_intensity_master',
  NUTRITION_MEAL_TYPES_MASTER: 'ic_nutrition_meal_types_master',
  NUTRITION_INTAKE_MASTER: 'ic_nutrition_intake_master',
  MTM_DIET_TYPES_MASTER: 'ic_mtm_diet_types_master',
  MTM_FLUIDS_MASTER: 'ic_mtm_fluids_master',
  MTM_MEAL_INTAKE_MASTER: 'ic_mtm_meal_intake_master',
  MTM_FLUID_INTAKE_MASTER: 'ic_mtm_fluid_intake_master',
  MTM_SWALLOWING_CONCERNS_MASTER: 'ic_mtm_swallowing_concerns_master',
  HYGIENE_LEVELS_MASTER: 'ic_hygiene_levels_master',
  BOWEL_AMOUNTS_MASTER: 'ic_bowel_amounts_master',
  BOWEL_ASSISTANCE_MASTER: 'ic_bowel_assistance_master',

  // Enums (PostgreSQL Enums don't need 'ic_' prefix in queries but might be useful to track)
  SHIFT_PERIOD_ENUM: 'ic_shift_period_enum',
  STATUS_ENUM: 'ic_status_enum',

  // System
  ACTIVITY_LOG: 'ic_activity_log',
  NOTIFICATIONS: 'ic_notifications',
  ERROR_LOGS: 'ic_error_logs',
  ROLE_PERMISSIONS: 'ic_role_permissions',
  REPORT_PREFERENCES: 'ic_report_preferences',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];


/**
 * Centralized RBAC module names.
 * These must match the columns in the 'role_permissions' database table.
 */
export const RBAC_MODULES = {
  // Personal Modules (Staff Portal)
  MY_ROSTER: 'my_roster',
  MY_TIMESHEETS: 'my_timesheets',
  MY_LEAVE: 'my_leave',
  SHIFT_ROUTINES: 'shift_routines',

  // Care Management
  PARTICIPANTS: 'participants',
  PARTICIPANT_GOALS: 'participant_goals',
  PARTICIPANT_BEHAVIOUR: 'participant_behaviour',
  PARTICIPANT_SUPPORT_NEEDS: 'participant_support_needs',
  PARTICIPANT_MEALTIME: 'participant_mealtime',
  PARTICIPANT_MEDICAL_ROUTINE: 'participant_medical_routine',
  PARTICIPANT_MEDICATIONS: 'participant_medications',
  PARTICIPANT_EMERGENCY: 'participant_emergency',
  PARTICIPANT_CONTACTS: 'participant_contacts',
  PARTICIPANT_DOCUMENTS: 'participant_documents',
  PARTICIPANT_SHIFT_NOTES: 'participant_shift_notes',
  PARTICIPANT_ACTIVITY_LOG: 'participant_activity_log',
  SHIFT_NOTES: 'shift_notes',

  // Employees & HR
  EMPLOYEES: 'employees',
  STAFF_EMPLOYMENT: 'staff_employment',
  STAFF_AVAILABILITY: 'staff_availability',
  STAFF_EMERGENCY: 'staff_emergency',
  STAFF_COMPLIANCE: 'staff_compliance',
  STAFF_TRAINING: 'staff_training',
  STAFF_DOCUMENTS: 'staff_documents',
  STAFF_ROSTER: 'staff_roster',
  STAFF_LEAVE: 'staff_leave',
  STAFF_WARNINGS: 'staff_warnings',
  STAFF_ACTIVITY_LOG: 'staff_activity_log',
  TIMESHEETS: 'timesheets',
  LEAVE_REQUESTS: 'leave_requests',

  // Operations & Facilities
  HOUSES: 'houses',
  HOUSE_MANAGEMENT: 'house_management',
  HOUSE_OPERATIONS: 'house_operations',
  HOUSE_CHECKLISTS: 'house_checklists',
  HOUSE_CHECKLIST_HISTORY: 'house_checklist_history',
  HOUSE_RESOURCES: 'house_resources',
  HOUSE_STAFF: 'house_staff',
  ROSTER_BOARD: 'roster_board',

  // System Administration
  ACCESS_CONTROL: 'access_control',
  MASTER_LISTS: 'master_lists',
  ACTIVITY_LOG: 'activity_log',
  HOUSE_ACTIVITY_LOG: 'house_activity_log',
  INCIDENT_MANAGEMENT: 'incident_management',

  // Reporting
  REPORTING_CLINICAL: 'reporting_clinical',
  REPORTING_OPERATIONAL: 'reporting_operational',
  REPORTING_COMPLIANCE: 'reporting_compliance',
} as const;

export type RBACModule = typeof RBAC_MODULES[keyof typeof RBAC_MODULES];

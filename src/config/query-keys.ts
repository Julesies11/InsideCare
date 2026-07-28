/**
 * Centralized TanStack Query keys.
 * Using constants ensures consistent cache invalidation across the app.
 */
export const QUERY_KEYS = {
  // Core Entities
  PARTICIPANTS: 'participants',
  STAFF: 'staff',
  HOUSES: 'houses',
  BRANCHES: 'branches',
  DEPARTMENTS: 'departments',
  ROLES: 'roles',

  // Operations
  SHIFTS: 'shifts',
  SHIFT_NOTES: 'shift-notes',
  TIMESHEETS: 'timesheets',
  LEAVE_REQUESTS: 'leave-requests',
  INCIDENT_REPORTS: 'incident-reports',
  CHECKLISTS: 'checklists',
  CHECKLIST_HISTORY: 'checklist-history',
  CALENDAR_EVENTS: 'calendar-events',
  ROSTER_SHIFTS: 'roster-shifts',
  HANDOVER_ISSUES: 'handover-issues',

  // Staff Portal / Personal
  MY_ROSTER: 'my-roster',
  MY_TIMESHEETS: 'my-timesheets',
  STAFF_DASHBOARD: 'staff-dashboard-data',
  CURRENT_SHIFT: 'current-staff-shift',

  // Master Lists
  MEDICATIONS_MASTER: 'medications-master',
  CONTACT_TYPES_MASTER: 'contact-types-master',
  CHECKLIST_MASTER: 'checklist-master',
  DEPARTMENTS_MASTER: 'departments-master',
  EMPLOYMENT_TYPES_MASTER: 'employment-types-master',
  HOUSE_TYPES_MASTER: 'house-types-master',
  EVENT_TYPES_MASTER: 'house-calendar-event-types-master',
  LEAVE_TYPES: 'leave-types',
  SHIFT_TEMPLATES: 'global-shift-templates',
  HOUSE_SHIFT_TEMPLATES: 'house-shift-templates',
  SEIZURE_TYPES_MASTER: 'seizure-types-master',
  INCIDENT_TYPES_MASTER: 'incident-types-master',
  RESTRICTIVE_PRACTICE_TYPES_MASTER: 'restrictive-practice-types-master',
  COMPLIANCE_TYPES_MASTER: 'compliance-types-master',
  ONBOARDING_ITEMS_MASTER: 'onboarding-items-master',
  HOUSE_COMPLIANCE_REQUIREMENTS: 'house-compliance-requirements',
  ID_DOCUMENT_TYPES: 'id-document-types',

  // Sub-entities
  STAFF_COMPLIANCE: 'staff-compliance',
  STAFF_COMPLIANCE_SUMMARY: 'staff-compliance-summary',
  STAFF_TRAINING: 'staff-training',
  STAFF_QUALIFICATIONS: 'staff-qualifications',
  STAFF_DOCUMENTS: 'staff-documents',
  PARTICIPANT_CONTACTS: 'participant-contacts',
  PARTICIPANT_DOCUMENTS: 'participant-documents',
  PARTICIPANT_GOALS: 'participant-goals',
  PARTICIPANT_MEDICATIONS: 'participant-medications',
  PARTICIPANT_PROVIDERS: 'participant-providers',
  HOUSE_DOCUMENTS: 'house-documents',
  HOUSE_RESOURCES: 'house-resources',
  HOUSE_COMMS: 'house-comms',
  HOUSE_STAFF_ASSIGNMENTS: 'house-staff-assignments',
  SHIFT_ASSIGNED_CHECKLISTS: 'shift-assigned-checklists',

  // System
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOG: 'activity-log',
  PERMISSIONS: 'permissions',
  ROLE_PERMISSIONS: 'role-permissions',
  SIGNED_URL: 'signed-url',
  ADMIN_AUTH_STATUS: 'admin-auth-status',
  REPORT_PREFERENCES: 'report-preferences',
} as const;

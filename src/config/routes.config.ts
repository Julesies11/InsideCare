export const ROUTES = {
  // Auth
  AUTH: '/auth',
  AUTH_SIGNIN: '/auth/signin',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_CHANGE_PASSWORD: '/auth/change-password',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_CHECK_EMAIL: '/auth/check-email',
  AUTH_WELCOME: '/auth/welcome-message',
  AUTH_DEACTIVATED: '/auth/account-deactivated',

  // Dashboards & Home
  HOME: '/',
  MY_DASHBOARD: '/my-dashboard',

  // Staff Portal
  MY_ROSTER: '/my-roster',
  MY_CHECKLISTS: '/my-checklists',
  MY_TIMESHEETS: '/my-timesheets',
  MY_LEAVE: '/my-leave',

  // People & Houses
  STAFF: '/staff',
  EMPLOYEES: '/employees',
  STAFF_PROFILES: '/employees/staff-profiles',
  STAFF_DETAIL: '/employees/staff-detail', // Base for dynamic: /employees/staff-detail/:id

  HOUSES: '/houses',
  HOUSE_PROFILES: '/houses/profiles',
  HOUSE_DETAIL: '/houses/detail', // Base for dynamic: /houses/detail/:id

  PARTICIPANTS: '/participants',
  PARTICIPANT_PROFILES: '/participants/profiles',
  PARTICIPANT_DETAIL: '/participants/detail', // Base for dynamic: /participants/detail/:id
  MEDICATION_REGISTER: '/participants/medication-register',
  SHIFT_NOTES: '/participants/shift-notes',
  SHIFT_NOTES_DETAIL: '/shift-notes/detail', // Base for dynamic: /shift-notes/detail/:id
  INCIDENT_REPORT: '/incidents',

  // Roster & Scheduling
  ROSTER_BOARD: '/roster-board',
  SHIFT_SETUP: '/shift-setup',
  TIMESHEET_APPROVALS: '/timesheet-approvals',
  LEAVE_APPROVALS: '/leave-approvals',

  // Reporting
  REPORTING: '/reporting',
  REPORTING_CLINICAL_INCIDENTS: '/reporting/clinical/incidents',
  REPORTING_CLINICAL_PARTICIPANTS: '/reporting/clinical/participants',

  // Account & Settings
  ACCOUNT: '/account',
  ACCOUNT_HOME: '/account/home',
  NOTIFICATIONS: '/account/notifications',
  SETTINGS: '/settings',
  USER_MANAGEMENT: '/user-management',

  // Administration
  ACCESS_CONTROL: '/access-control',
  CHECKLIST_TEMPLATES: '/checklist-templates',
  LEAVE_TYPES: '/admin/leave-types',
  COMPLIANCE_SETTINGS: '/admin/compliance-settings',
  ACTIVITY_LOG: '/activity-log',

  // Staff Portal Extras
  STAFF_PROFILE: '/staff/profile',

  // Errors
  ERROR: '/error',
  ERROR_403: '/error/403',
  ERROR_404: '/error/404',
  ERROR_500: '/error/500',
} as const;

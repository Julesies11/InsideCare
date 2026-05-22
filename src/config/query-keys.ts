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
  CHECKLISTS: 'checklists',
  CALENDAR_EVENTS: 'calendar-events',

  // Master Lists
  MEDICATIONS_MASTER: 'medications-master',
  CONTACT_TYPES_MASTER: 'contact-types-master',
  CHECKLIST_MASTER: 'checklist-master',

  // System
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOG: 'activity-log',
  PERMISSIONS: 'permissions',
} as const;

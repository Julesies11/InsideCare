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
  SHIFT_NOTES: 'shift_notes',

  // Employees & HR
  EMPLOYEES: 'employees',
  TIMESHEETS: 'timesheets',
  LEAVE_REQUESTS: 'leave_requests',

  // Operations & Facilities
  HOUSES: 'houses',
  HOUSE_CHECKLISTS: 'house_checklists',
  ROSTER_BOARD: 'roster_board',

  // System Administration
  ACCESS_CONTROL: 'access_control',
  MASTER_LISTS: 'master_lists',
  ACTIVITY_LOG: 'activity_log',
} as const;

export type RBACModule = typeof RBAC_MODULES[keyof typeof RBAC_MODULES];

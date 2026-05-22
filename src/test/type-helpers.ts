import { Database } from '@/models/database.types';

export type PublicSchema = Database['public'];
export type Tables = PublicSchema['Tables'];

// Helper to get Row type for a table
export type Row<T extends keyof Tables> = Tables[T]['Row'];

// Helper to get Insert type for a table
export type Insert<T extends keyof Tables> = Tables[T]['Insert'];

// Helper to get Update type for a table
export type Update<T extends keyof Tables> = Tables[T]['Update'];

// Common Row types for easy access in tests
export type StaffRow = Row<'ic_staff'>;
export type ParticipantRow = Row<'ic_participants'>;
export type HouseRow = Row<'ic_houses'>;
export type ShiftRow = Row<'ic_staff_shifts'>;
export type LeaveRequestRow = Row<'ic_leave_requests'>;
export type TimesheetRow = Row<'ic_timesheets'>;
export type NotificationRow = Row<'ic_notifications'>;
export type ActivityLogRow = Row<'ic_activity_log'>;
export type ChecklistMasterRow = Row<'ic_checklist_master'>;

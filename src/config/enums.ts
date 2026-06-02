/**
 * Centralized enum values for the application.
 */

export const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DRAFT: 'Draft',
  
  // Database lowercase variants
  active: 'active',
  inactive: 'inactive',
  draft: 'draft',
} as const;

export const CHECKLIST_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  
  // Database lowercase variants
  pending: 'pending',
  completed: 'completed',
  in_progress: 'in_progress',
} as const;

export const COMPLIANCE_STATUS = {
  COMPLETE: 'Complete',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
} as const;

export const TIMESHEET_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const SHIFT_PERIODS = {
  MORNING: 'morning',
  DAY: 'day',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
  SLEEPOVER: 'sleepover',
  ALL: 'all',
} as const;

export type ShiftPeriod = (typeof SHIFT_PERIODS)[keyof typeof SHIFT_PERIODS];


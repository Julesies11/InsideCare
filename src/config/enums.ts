/**
 * Centralized enum values for the application.
 */

export const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
  
  // Database lowercase variants
  active: 'active',
  inactive: 'inactive',
  draft: 'draft',
  archived: 'archived',
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

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

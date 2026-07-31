import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

export type StaffPortalState =
  | 'no_access'
  | 'active'
  | 'invite_pending'
  | 'invite_expired';

/**
 * Checks if a staff invitation link has expired based on the invite timestamp.
 * Default expiration is 24 hours.
 */
export function isInviteExpired(
  invitedAt: string | null | undefined,
  confirmedAt: string | null | undefined,
  expiryHours = 24,
): boolean {
  if (!invitedAt || confirmedAt) return false;
  try {
    const inviteDate = typeof invitedAt === 'string' ? parseISO(invitedAt) : new Date(invitedAt);
    const diffInHours = (Date.now() - inviteDate.getTime()) / (1000 * 60 * 60);
    return diffInHours >= expiryHours;
  } catch {
    return false;
  }
}

/**
 * Returns human-readable time remaining before an invite link expires.
 */
export function getInviteTimeRemaining(
  invitedAt: string | null | undefined,
  expiryHours = 24,
): string {
  if (!invitedAt) return '';
  try {
    const inviteDate = typeof invitedAt === 'string' ? parseISO(invitedAt) : new Date(invitedAt);
    const expiresAt = new Date(inviteDate.getTime() + expiryHours * 60 * 60 * 1000);
    const now = new Date();

    if (now >= expiresAt) {
      return 'Expired';
    }

    const hoursLeft = differenceInHours(expiresAt, now);
    if (hoursLeft >= 1) {
      return `${hoursLeft}h remaining`;
    }

    const minsLeft = Math.max(1, differenceInMinutes(expiresAt, now));
    return `${minsLeft}m remaining`;
  } catch {
    return '';
  }
}

/**
 * Computes staff portal access state given auth user status.
 */
export function getStaffPortalState(
  staffAuthUserId: string | null | undefined,
  authUserStatus: {
    invited_at?: string | null;
    confirmed_at?: string | null;
    last_sign_in_at?: string | null;
  } | null | undefined,
  expiryHours = 24,
): StaffPortalState {
  if (!staffAuthUserId) return 'no_access';
  if (authUserStatus?.confirmed_at || authUserStatus?.last_sign_in_at) {
    return 'active';
  }
  if (isInviteExpired(authUserStatus?.invited_at, authUserStatus?.confirmed_at, expiryHours)) {
    return 'invite_expired';
  }
  return 'invite_pending';
}

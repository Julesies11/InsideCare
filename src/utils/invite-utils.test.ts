import { describe, expect, it } from 'vitest';
import {
  getInviteTimeRemaining,
  getStaffPortalState,
  isInviteExpired,
} from './invite-utils';

describe('invite-utils', () => {
  describe('isInviteExpired', () => {
    it('returns false if no invitedAt timestamp', () => {
      expect(isInviteExpired(null, null)).toBe(false);
      expect(isInviteExpired(undefined, null)).toBe(false);
    });

    it('returns false if user has already confirmed invite', () => {
      const yesterday = new Date(Date.now() - 30 * 360 * 1000).toISOString();
      const confirmed = new Date().toISOString();
      expect(isInviteExpired(yesterday, confirmed)).toBe(false);
    });

    it('returns false if invite was sent less than 24 hours ago', () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
      expect(isInviteExpired(fiveHoursAgo, null)).toBe(false);
    });

    it('returns true if invite was sent more than 24 hours ago', () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
      expect(isInviteExpired(twentyFiveHoursAgo, null)).toBe(true);
    });
  });

  describe('getInviteTimeRemaining', () => {
    it('returns formatted hours remaining for fresh invite', () => {
      const tenHoursAgo = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
      const remaining = getInviteTimeRemaining(tenHoursAgo);
      expect(remaining).toMatch(/\d+h remaining/);
    });

    it('returns Expired for old invite', () => {
      const thirtyHoursAgo = new Date(Date.now() - 30 * 3600 * 1000).toISOString();
      expect(getInviteTimeRemaining(thirtyHoursAgo)).toBe('Expired');
    });
  });

  describe('getStaffPortalState', () => {
    it('returns no_access when staffAuthUserId is null', () => {
      expect(getStaffPortalState(null, null)).toBe('no_access');
    });

    it('returns active when confirmed_at or last_sign_in_at exists', () => {
      expect(
        getStaffPortalState('auth-123', { confirmed_at: new Date().toISOString() }),
      ).toBe('active');
    });

    it('returns invite_expired for expired pending invite', () => {
      const oldInvite = new Date(Date.now() - 30 * 3600 * 1000).toISOString();
      expect(getStaffPortalState('auth-123', { invited_at: oldInvite })).toBe('invite_expired');
    });

    it('returns invite_pending for fresh pending invite', () => {
      const freshInvite = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(getStaffPortalState('auth-123', { invited_at: freshInvite })).toBe('invite_pending');
    });
  });
});

/**
 * Unit Tests: Portal Status Logic
 *
 * Tests the portal status badge derivation logic extracted from
 * src/pages/employees/staff-detail/staff-detail-page.tsx.
 *
 * Three states are possible:
 *  1. No Portal Access  — staff has no auth_user_id
 *  2. Invite Pending    — auth user exists but confirmed_at and last_sign_in_at are both null
 *  3. Portal Active     — auth user has confirmed_at or last_sign_in_at set
 */
import { describe, expect, it } from 'vitest';
import type { AuthUserStatus } from '@/hooks/use-auth-status';

// ---------------------------------------------------------------------------
// Pure helper extracted from staff-detail-page.tsx (mirrors production logic)
// ---------------------------------------------------------------------------

interface PortalBadge {
  label: 'No Portal Access' | 'Invite Pending' | 'Portal Active';
  variant: 'destructive' | 'warning' | 'success';
}

function derivePortalBadge(
  staffAuthUserId: string | null | undefined,
  authStatusMap: Record<string, AuthUserStatus> | undefined,
): PortalBadge {
  if (!staffAuthUserId) {
    return { label: 'No Portal Access', variant: 'destructive' };
  }
  const authUserStatus = authStatusMap?.[staffAuthUserId] ?? null;
  const isPortalConfirmed = !!(
    authUserStatus?.confirmed_at || authUserStatus?.last_sign_in_at
  );
  return isPortalConfirmed
    ? { label: 'Portal Active', variant: 'success' }
    : { label: 'Invite Pending', variant: 'warning' };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const BASE_AUTH_USER: AuthUserStatus = {
  id: 'auth-user-1',
  email: 'staff@example.com',
  created_at: '2026-01-01T00:00:00Z',
  invited_at: '2026-01-02T00:00:00Z',
  confirmed_at: null,
  last_sign_in_at: null,
};

describe('Portal Status Badge Derivation', () => {
  // ── State 1: No Portal Access ────────────────────────────────────────────

  it('returns "No Portal Access" when staffAuthUserId is undefined', () => {
    const badge = derivePortalBadge(undefined, {});
    expect(badge.label).toBe('No Portal Access');
    expect(badge.variant).toBe('destructive');
  });

  it('returns "No Portal Access" when staffAuthUserId is null', () => {
    const badge = derivePortalBadge(null, {});
    expect(badge.label).toBe('No Portal Access');
    expect(badge.variant).toBe('destructive');
  });

  it('returns "No Portal Access" when staffAuthUserId is empty string', () => {
    const badge = derivePortalBadge('', {});
    expect(badge.label).toBe('No Portal Access');
    expect(badge.variant).toBe('destructive');
  });

  // ── State 2: Invite Pending ──────────────────────────────────────────────

  it('returns "Invite Pending" when auth user exists but has never logged in or confirmed', () => {
    const authMap: Record<string, AuthUserStatus> = {
      'auth-user-1': { ...BASE_AUTH_USER, confirmed_at: null, last_sign_in_at: null },
    };
    const badge = derivePortalBadge('auth-user-1', authMap);
    expect(badge.label).toBe('Invite Pending');
    expect(badge.variant).toBe('warning');
  });

  it('returns "Invite Pending" when authStatusMap is undefined (admin data not yet loaded)', () => {
    const badge = derivePortalBadge('auth-user-1', undefined);
    expect(badge.label).toBe('Invite Pending');
    expect(badge.variant).toBe('warning');
  });

  it('returns "Invite Pending" when auth user id is not present in the status map', () => {
    const authMap: Record<string, AuthUserStatus> = {
      'some-other-user': BASE_AUTH_USER,
    };
    const badge = derivePortalBadge('auth-user-1', authMap);
    expect(badge.label).toBe('Invite Pending');
    expect(badge.variant).toBe('warning');
  });

  // ── State 3: Portal Active ───────────────────────────────────────────────

  it('returns "Portal Active" when confirmed_at is set and last_sign_in_at is null', () => {
    const authMap: Record<string, AuthUserStatus> = {
      'auth-user-1': {
        ...BASE_AUTH_USER,
        confirmed_at: '2026-01-03T10:00:00Z',
        last_sign_in_at: null,
      },
    };
    const badge = derivePortalBadge('auth-user-1', authMap);
    expect(badge.label).toBe('Portal Active');
    expect(badge.variant).toBe('success');
  });

  it('returns "Portal Active" when last_sign_in_at is set and confirmed_at is null', () => {
    const authMap: Record<string, AuthUserStatus> = {
      'auth-user-1': {
        ...BASE_AUTH_USER,
        confirmed_at: null,
        last_sign_in_at: '2026-06-15T09:30:00Z',
      },
    };
    const badge = derivePortalBadge('auth-user-1', authMap);
    expect(badge.label).toBe('Portal Active');
    expect(badge.variant).toBe('success');
  });

  it('returns "Portal Active" when both confirmed_at and last_sign_in_at are set', () => {
    const authMap: Record<string, AuthUserStatus> = {
      'auth-user-1': {
        ...BASE_AUTH_USER,
        confirmed_at: '2026-01-03T10:00:00Z',
        last_sign_in_at: '2026-06-15T09:30:00Z',
      },
    };
    const badge = derivePortalBadge('auth-user-1', authMap);
    expect(badge.label).toBe('Portal Active');
    expect(badge.variant).toBe('success');
  });

  // ── isPortalConfirmed determines button label ────────────────────────────

  describe('isPortalConfirmed flag', () => {
    function deriveIsPortalConfirmed(
      authUserStatus: Partial<AuthUserStatus> | null,
    ): boolean {
      return !!(authUserStatus?.confirmed_at || authUserStatus?.last_sign_in_at);
    }

    it('is false when authUserStatus is null', () => {
      expect(deriveIsPortalConfirmed(null)).toBe(false);
    });

    it('is false when both confirmed_at and last_sign_in_at are null', () => {
      expect(deriveIsPortalConfirmed({ confirmed_at: null, last_sign_in_at: null })).toBe(false);
    });

    it('is true when confirmed_at is present', () => {
      expect(deriveIsPortalConfirmed({ confirmed_at: '2026-01-03T10:00:00Z', last_sign_in_at: null })).toBe(true);
    });

    it('is true when last_sign_in_at is present', () => {
      expect(deriveIsPortalConfirmed({ confirmed_at: null, last_sign_in_at: '2026-06-15T09:30:00Z' })).toBe(true);
    });

    it('determines dropdown label: "Send Password Reset" vs "Resend Invite"', () => {
      const confirmedLabel = (isConfirmed: boolean) =>
        isConfirmed ? 'Send Password Reset' : 'Resend Invite';

      expect(confirmedLabel(true)).toBe('Send Password Reset');
      expect(confirmedLabel(false)).toBe('Resend Invite');
    });
  });
});

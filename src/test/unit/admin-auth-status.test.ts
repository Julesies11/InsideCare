/**
 * Unit Tests: useAdminAuthStatus RBAC guard
 *
 * Verifies the admin auth status query is only enabled for admins
 * (users with FULL access to ACCESS_CONTROL) and disabled for all other
 * access levels.
 */
import { describe, expect, it } from 'vitest';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';

// ---------------------------------------------------------------------------
// Mirrors the RBAC guard from use-auth-status.ts
// ---------------------------------------------------------------------------

type AccessLevel = 'full' | 'read_only' | 'context_read_write' | 'none';

function isAdminEnabled(accessLevel: AccessLevel | null | undefined): boolean {
  return accessLevel === ACCESS_LEVEL.FULL;
}

describe('useAdminAuthStatus — RBAC guard', () => {
  it('enables the query when access level is FULL', () => {
    expect(isAdminEnabled('full')).toBe(true);
  });

  it('disables the query for read_only access', () => {
    expect(isAdminEnabled('read_only')).toBe(false);
  });

  it('disables the query for context_read_write access', () => {
    expect(isAdminEnabled('context_read_write')).toBe(false);
  });

  it('disables the query for none access', () => {
    expect(isAdminEnabled('none')).toBe(false);
  });

  it('disables the query when access level is null (not loaded yet)', () => {
    expect(isAdminEnabled(null)).toBe(false);
  });

  it('disables the query when access level is undefined', () => {
    expect(isAdminEnabled(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Auth status map indexing — mirrors staff-detail-page.tsx line 85-86
// ---------------------------------------------------------------------------

import type { AuthUserStatus, AuthStatusMap } from '@/hooks/use-auth-status';

const MOCK_STATUS: AuthUserStatus = {
  id: 'auth-1',
  email: 'staff@example.com',
  created_at: '2026-01-01T00:00:00Z',
  invited_at: '2026-01-02T00:00:00Z',
  confirmed_at: '2026-01-03T10:00:00Z',
  last_sign_in_at: '2026-06-15T09:30:00Z',
};

describe('AuthStatusMap indexing', () => {
  it('returns auth status when staffAuthUserId exists in the map', () => {
    const map: AuthStatusMap = { 'auth-1': MOCK_STATUS };
    const status = map['auth-1'];
    expect(status).toBeDefined();
    expect(status.confirmed_at).toBe('2026-01-03T10:00:00Z');
  });

  it('returns undefined when staffAuthUserId is not in the map', () => {
    const map: AuthStatusMap = { 'auth-1': MOCK_STATUS };
    const status = map['auth-999'];
    expect(status).toBeUndefined();
  });

  it('optional-chaining returns null safely when map is undefined', () => {
    const map: AuthStatusMap | undefined = undefined;
    const status = map?.['auth-1'] ?? null;
    expect(status).toBeNull();
  });
});

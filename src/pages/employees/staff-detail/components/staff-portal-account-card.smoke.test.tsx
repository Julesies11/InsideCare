import { renderWithProviders, screen } from '@/test/test-utils';
import { describe, expect, it } from 'vitest';
import { StaffPortalAccountCard } from './staff-portal-account-card';

describe('StaffPortalAccountCard Smoke Test', () => {
  it('renders cleanly for uninvited active staff', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-0"
        email="test0@example.com"
        staffAuthUserId={null}
        authUserStatus={null}
        staffEmploymentStatus="active"
        onInvite={async () => {}}
        onRevokeInvite={async () => {}}
        isAdmin={true}
      />,
    );
    expect(screen.getByText(/Portal Access:/i)).toBeInTheDocument();
  });

  it('renders cleanly for pending invite', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-1"
        email="test1@example.com"
        staffAuthUserId="user-1"
        authUserStatus={{ invited_at: new Date().toISOString() }}
        staffEmploymentStatus="active"
        onInvite={async () => {}}
        onRevokeInvite={async () => {}}
        isAdmin={true}
      />,
    );
    expect(screen.getByText(/Portal Access:/i)).toBeInTheDocument();
  });

  it('renders cleanly for active confirmed user', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-2"
        email="test2@example.com"
        staffAuthUserId="user-2"
        authUserStatus={{ confirmed_at: new Date().toISOString() }}
        staffEmploymentStatus="active"
        onInvite={async () => {}}
        onRevokeInvite={async () => {}}
        isAdmin={true}
      />,
    );
    expect(screen.getByText(/Portal Access:/i)).toBeInTheDocument();
  });
});

import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { StaffPortalAccountCard } from './staff-portal-account-card';

describe('StaffPortalAccountCard', () => {
  it('renders Login Disabled badge when staff has no auth user ID', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-1"
        email="jane.doe@insidecare.org"
        staffAuthUserId={null}
        authUserStatus={null}
        onInvite={async () => {}}
        isAdmin={true}
      />,
    );

    expect(screen.getByText(/Portal Access:/i)).toBeInTheDocument();
    expect(screen.getByText(/Login Disabled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Portal Invite/i })).toBeInTheDocument();
  });

  it('renders Login Enabled badge when auth user is confirmed', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-1"
        email="jane.doe@insidecare.org"
        staffAuthUserId="auth-user-123"
        authUserStatus={{
          confirmed_at: '2026-07-28T10:00:00Z',
          last_sign_in_at: '2026-07-29T14:30:00Z',
        }}
        onInvite={async () => {}}
        onRevokeInvite={async () => {}}
        isAdmin={true}
      />,
    );

    expect(screen.getByText(/Login Enabled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Password Reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disable Web Login/i })).toBeInTheDocument();
  });

  it('disables Send Portal Invite button when employment status is inactive', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-1"
        email="jane.doe@insidecare.org"
        staffAuthUserId={null}
        authUserStatus={null}
        staffEmploymentStatus="inactive"
        onInvite={async () => {}}
        isAdmin={true}
      />,
    );

    const inviteBtn = screen.getByRole('button', { name: /Send Portal Invite/i });
    expect(inviteBtn).toBeDisabled();
  });

  it('triggers onInvite handler when Send Portal Invite button is clicked', () => {
    const onInvite = vi.fn();
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-1"
        email="jane.doe@insidecare.org"
        staffAuthUserId={null}
        authUserStatus={null}
        staffEmploymentStatus="active"
        onInvite={onInvite}
        isAdmin={true}
      />,
    );

    const inviteBtn = screen.getByRole('button', { name: /Send Portal Invite/i });
    fireEvent.click(inviteBtn);
    expect(onInvite).toHaveBeenCalledTimes(1);
  });

  it('renders Draft profile helper notice and disables invite button when status is draft', () => {
    renderWithProviders(
      <StaffPortalAccountCard
        staffId="staff-1"
        email="jane.doe@insidecare.org"
        staffAuthUserId={null}
        authUserStatus={null}
        staffEmploymentStatus="draft"
        onInvite={async () => {}}
        isAdmin={true}
      />,
    );

    expect(screen.getByText(/Draft profile — activate employee to send portal invite/i)).toBeInTheDocument();
    const inviteBtn = screen.getByRole('button', { name: /Send Portal Invite/i });
    expect(inviteBtn).toBeDisabled();
  });
});

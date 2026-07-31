import { renderWithProviders, screen } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { StaffActivationDialog } from './staff-activation-dialog';
import { StaffDeactivationDialog } from './staff-deactivation-dialog';

describe('Staff Lifecycle Dialogs', () => {
  describe('StaffDeactivationDialog', () => {
    it('renders with correct information for user with portal access', async () => {
      const onConfirm = vi.fn();
      renderWithProviders(
        <StaffDeactivationDialog
          open={true}
          onOpenChange={() => {}}
          staffName="John Doe"
          hasPortalAccess={true}
          onConfirmDeactivate={onConfirm}
        />,
      );

      expect(screen.getByText(/Deactivate Staff Member/i)).toBeInTheDocument();
      expect(screen.getAllByText(/John Doe/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/1-Click Deactivation & Web Login Disabling/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deactivate & Disable Login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deactivate Without Disabling Login/i })).toBeInTheDocument();
    });

    it('renders simpler UI for user without portal access', async () => {
      renderWithProviders(
        <StaffDeactivationDialog
          open={true}
          onOpenChange={() => {}}
          staffName="John Doe"
          hasPortalAccess={false}
          onConfirmDeactivate={async () => {}}
        />,
      );

      expect(
        screen.queryByText(/1-Click Deactivation/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^Deactivate Staff$/i }),
      ).toBeInTheDocument();
    });
  });

  describe('StaffActivationDialog', () => {
    it('offers invitation when email is provided and no portal access exists', async () => {
      renderWithProviders(
        <StaffActivationDialog
          open={true}
          onOpenChange={() => {}}
          staffName="Jane Smith"
          email="jane@example.com"
          onConfirmActivate={async () => {}}
        />,
      );

      expect(screen.getByText(/Activate Staff Member/i)).toBeInTheDocument();
      expect(screen.getByText(/1-Click Activation & Invitation/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Activate & Send Invite/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Activate Without Invite/i }),
      ).toBeInTheDocument();
    });

    it('shows simple activation when no email is provided', async () => {
      renderWithProviders(
        <StaffActivationDialog
          open={true}
          onOpenChange={() => {}}
          staffName="Jane Smith"
          onConfirmActivate={async () => {}}
        />,
      );

      expect(
        screen.queryByText(/1-Click Activation/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^Activate Staff$/i }),
      ).toBeInTheDocument();
    });
  });
});

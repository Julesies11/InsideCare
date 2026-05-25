import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { StaffDeactivationDialog } from './staff-deactivation-dialog';
import { StaffActivationDialog } from './staff-activation-dialog';
import { describe, it, expect, vi } from 'vitest';

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
        />
      );

      expect(screen.getByText(/Deactivate Staff Member/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Portal Access Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Revoke Access/i)).toBeInTheDocument();
      expect(screen.getByText(/Deactivate Only/i)).toBeInTheDocument();
    });

    it('renders simpler UI for user without portal access', async () => {
      renderWithProviders(
        <StaffDeactivationDialog
          open={true}
          onOpenChange={() => {}}
          staffName="John Doe"
          hasPortalAccess={false}
          onConfirmDeactivate={async () => {}}
        />
      );

      expect(screen.queryByText(/Portal Access Detected/i)).not.toBeInTheDocument();
      // Use getByRole to target the actual button, avoiding the dialog title
      expect(screen.getByRole('button', { name: /^Deactivate Staff$/i })).toBeInTheDocument();
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
        />
      );

      expect(screen.getByText(/Activate Staff Member/i)).toBeInTheDocument();
      expect(screen.getByText(/Portal Access Required/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Activate & Invite/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Activate Only/i })).toBeInTheDocument();
    });

    it('shows simple activation when no email is provided', async () => {
      renderWithProviders(
        <StaffActivationDialog
          open={true}
          onOpenChange={() => {}}
          staffName="Jane Smith"
          onConfirmActivate={async () => {}}
        />
      );

      expect(screen.queryByText(/Portal Access Required/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Activate Staff$/i })).toBeInTheDocument();
    });
  });
});

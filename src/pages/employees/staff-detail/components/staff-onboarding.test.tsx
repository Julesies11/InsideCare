import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { StaffOnboardingSection } from './staff-onboarding';
import { useStaffOnboardingSummary } from '@/hooks/use-staff';
import { emptyStaffPendingChanges } from '@/models/staff-pending-changes';

// Mock the hook
vi.mock('@/hooks/use-staff', () => ({
  useStaffOnboardingSummary: vi.fn(),
}));

describe('StaffOnboardingSection', () => {
  it('should render loading state', () => {
    (useStaffOnboardingSummary as any).mockReturnValue({
      data: [],
      isLoading: true,
    });

    renderWithProviders(
      <StaffOnboardingSection
        staffId="staff-1"
        canEdit={true}
        pendingChanges={emptyStaffPendingChanges}
      />,
    );

    expect(screen.getByText(/Loading onboarding items/)).toBeInTheDocument();
  });

  it('should render items and handle toggle', () => {
    const mockSummary = [
      {
        item_id: 'item-1',
        item_name: 'Interview',
        is_complete: false,
        comments: '',
        record_id: null,
      },
    ];
    (useStaffOnboardingSummary as any).mockReturnValue({
      data: mockSummary,
      isLoading: false,
    });

    const onPendingChangesChange = vi.fn();

    renderWithProviders(
      <StaffOnboardingSection
        staffId="staff-1"
        canEdit={true}
        pendingChanges={emptyStaffPendingChanges}
        onPendingChangesChange={onPendingChangesChange}
      />,
    );

    expect(screen.getByText('Interview')).toBeInTheDocument();
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onPendingChangesChange).toHaveBeenCalled();
  });
});

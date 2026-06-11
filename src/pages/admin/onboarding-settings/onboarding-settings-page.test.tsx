import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingSettingsPage } from './onboarding-settings-page';
import { useOnboardingItemsMaster } from '@/hooks/use-staff';

vi.mock('@/hooks/use-staff', () => ({
  useOnboardingItemsMaster: vi.fn(),
  useAddOnboardingItemMaster: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateOnboardingItemMaster: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

describe('OnboardingSettingsPage', () => {
  it('should render the list of onboarding items', () => {
    const mockItems = [
      { id: '1', item_name: 'Task A', sort_order: 10, is_active: true },
      { id: '2', item_name: 'Task B', sort_order: 20, is_active: false },
    ];
    (useOnboardingItemsMaster as any).mockReturnValue({
      items: mockItems,
      isLoading: false,
    });

    renderWithProviders(<OnboardingSettingsPage />);

    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should open the add dialog when clicking add button', () => {
    (useOnboardingItemsMaster as any).mockReturnValue({
      items: [],
      isLoading: false,
    });

    renderWithProviders(<OnboardingSettingsPage />);

    const addButton = screen.getByText('Add Onboarding Item');
    fireEvent.click(addButton);

    expect(screen.getByText('Define a task for the staff onboarding checklist.')).toBeInTheDocument();
  });
});

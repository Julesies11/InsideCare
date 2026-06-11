import { renderWithProviders, screen } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingSettingsPage } from './onboarding-settings-page';

// Mock the hooks to avoid network calls
vi.mock('@/hooks/use-staff', () => ({
  useOnboardingItemsMaster: vi.fn(() => ({ items: [], isLoading: false })),
  useAddOnboardingItemMaster: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateOnboardingItemMaster: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

describe('OnboardingSettingsPage Smoke Test', () => {
  it('should render the onboarding settings page without crashing', async () => {
    renderWithProviders(<OnboardingSettingsPage />);

    // Check title and description
    expect(screen.getByText('Onboarding Settings')).toBeInTheDocument();
    expect(
      screen.getByText(/Manage the master list of tasks for staff onboarding/),
    ).toBeInTheDocument();

    // Check if the add button is present
    expect(screen.getByText('Add Onboarding Item')).toBeInTheDocument();
  });
});

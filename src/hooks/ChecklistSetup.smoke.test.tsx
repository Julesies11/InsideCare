import { HouseChecklistSetup } from '@/pages/houses/detail/components/house-checklist-setup';
import { fireEvent, renderWithProviders, screen } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';

// Mock the hooks
vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [],
    isLoading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-checklist-master', () => ({
  useChecklistMaster: () => ({
    masterChecklists: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [],
    isLoading: false,
  }),
  useActiveHouses: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe('HouseChecklistSetup Dialogs', () => {
  it('opens Import dialog and shows source houses', async () => {
    renderWithProviders(
      <HouseChecklistSetup
        houseId="test-house"
        canAdd={true}
        canDelete={true}
      />,
    );

    const importBtn = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importBtn);

    expect(
      screen.getByRole('heading', { name: /Import Checklists/i }),
    ).toBeInTheDocument();
  });

  it('allows opening the Add Checklist dialog', async () => {
    renderWithProviders(
      <HouseChecklistSetup
        houseId="test-house"
        canAdd={true}
        canDelete={true}
      />,
    );

    const addBtn = screen.getByRole('button', { name: /add checklist/i });
    fireEvent.click(addBtn);

    // Check for dialog title specifically
    expect(screen.getByText(/New House Checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Checklist Name/i)).toBeInTheDocument();
  });
});

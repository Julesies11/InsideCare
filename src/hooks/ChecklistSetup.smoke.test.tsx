import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { HouseChecklistSetup } from '@/pages/houses/detail/components/house-checklist-setup';
import { describe, it, expect, vi } from 'vitest';

// Mock the hooks
vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [],
    isLoading: false,
    refresh: vi.fn()
  })
}));

vi.mock('@/hooks/use-checklist-master', () => ({
  useChecklistMaster: () => ({
    masterChecklists: [],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [],
    isLoading: false
  })
}));

describe('HouseChecklistSetup Dialogs', () => {
  it('opens Import dialog and shows source houses', async () => {
    renderWithProviders(<HouseChecklistSetup houseId="test-house" canAdd={true} canDelete={true} />);
    
    const importBtn = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importBtn);
    
    expect(screen.getByText(/Import Checklists/i)).toBeInTheDocument();
  });

  it('allows opening the Add Checklist dialog', async () => {
    renderWithProviders(<HouseChecklistSetup houseId="test-house" canAdd={true} canDelete={true} />);
    
    const addBtn = screen.getByRole('button', { name: /add checklist/i });
    fireEvent.click(addBtn);
    
    // Check for dialog title specifically
    expect(screen.getByRole('heading', { name: /add checklist/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });
});

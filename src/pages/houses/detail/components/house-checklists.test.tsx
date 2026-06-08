import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { HouseChecklistSetup } from './house-checklist-setup';

// Mock hooks
vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: vi.fn(() => ({
    houseChecklists: [],
    loading: false,
    refresh: vi.fn()
  }))
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: vi.fn(() => ({
    houses: [
      { id: 'house-1', house_name: 'Source House', status: 'active' },
      { id: 'house-2', house_name: 'Other House', status: 'active' }
    ],
    loading: false
  })),
  useActiveHouses: vi.fn(() => ({
    data: [
      { id: 'house-1', house_name: 'Source House', status: 'active' },
      { id: 'house-2', house_name: 'Other House', status: 'active' }
    ],
    loading: false
  }))
}));

vi.mock('@/hooks/use-checklist-master', () => ({
  useChecklistMaster: vi.fn(() => ({
    masterChecklists: [],
    loading: false
  }))
}));

describe('HouseChecklistSetup Component', () => {
  const mockPendingChanges = {
    checklists: { toAdd: [], toUpdate: [], toDelete: [], checklistItems: { toAdd: [], toUpdate: [], toDelete: [] } }
  };

  it('renders correctly and shows import and add buttons', () => {
    renderWithProviders(
      <HouseChecklistSetup 
        houseId="house-current" 
        canAdd={true} 
        canDelete={true} 
        pendingChanges={mockPendingChanges as any}
      />
    );

    expect(screen.getByText(/Checklist Setup/i)).toBeDefined();
    expect(screen.getByText(/Import/i)).toBeDefined();
    expect(screen.getByText(/Add Checklist/i)).toBeDefined();
  });

  it('opens import dialog and lists source houses', async () => {
    const { user } = renderWithProviders(
      <HouseChecklistSetup 
        houseId="house-current" 
        canAdd={true} 
        canDelete={true} 
        pendingChanges={mockPendingChanges as any}
      />
    );

    const importBtn = screen.getByRole('button', { name: /Import/i });
    await user.click(importBtn);

    // Dialog title check
    expect(screen.getByRole('heading', { name: /Import Checklists/i })).toBeInTheDocument();
    
    // Open select - searching for the trigger text
    const selectTrigger = screen.getByText(/Select source house.../i);
    // Use fireEvent for the select trigger as Radix UI sometimes sets pointer-events: none 
    // during transitions which causes userEvent.click to fail
    fireEvent.click(selectTrigger);

    await waitFor(async () => {
      // Use findByRole('option') to specifically target the items in the dropdown
      // and avoid ambiguity with the "Source House" label
      const sourceHouse = await screen.findByRole('option', { name: /Source House/i });
      expect(sourceHouse).toBeInTheDocument();
      
      const otherHouse = await screen.findByRole('option', { name: /Other House/i });
      expect(otherHouse).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});

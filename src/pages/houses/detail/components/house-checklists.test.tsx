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
      { id: 'house-1', name: 'Source House', status: 'active' },
      { id: 'house-2', name: 'Other House', status: 'active' }
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

    expect(screen.getByText(/House Checklists/i)).toBeDefined();
    expect(screen.getByText(/Import Checklists/i)).toBeDefined();
    expect(screen.getByText(/Add Checklist/i)).toBeDefined();
  });

  it('opens import dialog and lists source houses', async () => {
    renderWithProviders(
      <HouseChecklistSetup 
        houseId="house-current" 
        canAdd={true} 
        canDelete={true} 
        pendingChanges={mockPendingChanges as any}
      />
    );

    const importBtn = screen.getByText(/Import Checklists/i);
    fireEvent.click(importBtn);

    expect(screen.getByText(/Source House/i)).toBeDefined();
    
    // Open select
    const selectTrigger = screen.getByText(/Select house.../i);
    fireEvent.click(selectTrigger);

    await waitFor(() => {
      expect(screen.getAllByText(/Source House/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Other House/i).length).toBeGreaterThan(0);
    });
  });
});

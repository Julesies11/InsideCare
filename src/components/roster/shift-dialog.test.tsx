import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { ShiftDialog } from './shift-dialog';
import { describe, it, expect, vi } from 'vitest';

// Mock hooks used in ShiftDialog
vi.mock('@/hooks/use-staff', () => ({
  useStaff: () => ({
    staff: [
      { id: 's1', name: 'Active Staff', status: 'active' },
      { id: 's2', name: 'Inactive Staff', status: 'inactive' }
    ],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [{ id: 'h1', name: 'House 1' }],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({
    participants: [
      { id: 'p1', name: 'UniqueActive Participant', status: 'active', house_id: 'h1' },
      { id: 'p2', name: 'UniqueInactive Participant', status: 'inactive', house_id: 'h1' }
    ],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [],
    isLoading: false
  })
}));

describe('ShiftDialog Logic', () => {
  const mockProps: any = {
    open: true,
    onOpenChange: vi.fn(),
    shift: null,
    onSave: vi.fn(),
    onDelete: vi.fn()
  };

  it('filters out inactive participants from house view', async () => {
    renderWithProviders(<ShiftDialog {...mockProps} preSelectedHouseId="h1" />);
    
    // Check for active participant
    expect(screen.getByText(/UniqueActive Participant/i)).toBeInTheDocument();
    
    // Check that inactive participant is NOT rendered
    const inactivePart = screen.queryByText(/UniqueInactive Participant/i);
    expect(inactivePart).not.toBeInTheDocument();
  });

  it('does NOT show Quick Fill Org Shift Templates section', () => {
    renderWithProviders(<ShiftDialog {...mockProps} preSelectedHouseId="h1" />);
    expect(screen.queryByText(/Quick Fill Org Shift Templates/i)).not.toBeInTheDocument();
  });

  it('allows saving a shift with no staff member selected (Open Shift)', async () => {
    const onSave = vi.fn().mockResolvedValue({ id: 'new-id' });
    renderWithProviders(<ShiftDialog {...mockProps} onSave={onSave} />);
    
    const saveButton = screen.getByRole('button', { name: /Create Shift/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});

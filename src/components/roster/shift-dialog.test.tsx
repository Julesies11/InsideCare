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

vi.mock('@/hooks/use-house-shift-templates', () => ({
  useHouseShiftTemplates: () => ({
    shiftTemplates: [],
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

  it('allows staff selection for admins even if staffSelectionDisabled is true', async () => {
    // renderWithProviders by default provides an admin user (isAdmin: true)
    renderWithProviders(<ShiftDialog {...mockProps} staffSelectionDisabled={true} />);
    
    const staffSelect = screen.getByRole('combobox', { name: /Assign Staff/i });
    expect(staffSelect).not.toBeDisabled();
  });

  it('hides Service Location when editing an existing shift', () => {
    const existingShift = {
      id: 's1',
      house_id: 'h1',
      start_date: '2026-04-05',
      start_time: '09:00',
      end_time: '17:00',
      shift_template: 'SIL'
    };
    renderWithProviders(<ShiftDialog {...mockProps} shift={existingShift} />);
    
    expect(screen.queryByRole('combobox', { name: /Service Location/i })).not.toBeInTheDocument();
  });
});

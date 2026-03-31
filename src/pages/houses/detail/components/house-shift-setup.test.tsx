import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { HouseShiftSetup } from './house-shift-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';

// Mock Supabase globally to prevent actual network calls
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}));

// Mock Hooks with tracker functions
const refreshShiftTypesMock = vi.fn();
const refreshTemplatesMock = vi.fn();

vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [
      { id: '1', name: 'Morning Shift', default_start_time: '07:00:00', default_end_time: '15:00:00', color_theme: 'morning', icon_name: 'Sun' },
    ],
    isLoading: false,
    refresh: refreshShiftTypesMock
  })
}));

const mockMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

vi.mock('@/hooks/use-shift-templates', () => ({
  useShiftTemplates: () => ({
    defaults: [],
    groups: [],
    schedules: [],
    isLoading: false,
    refresh: refreshTemplatesMock,
    createGroup: mockMutation,
    deleteGroup: mockMutation,
    upsertItem: mockMutation,
    deleteItem: mockMutation,
    updateDefaults: mockMutation,
    createSchedule: mockMutation,
    deleteSchedule: mockMutation,
  })
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [],
    isLoading: false
  })
}));

describe('HouseShiftSetup Unit Test (directSave)', () => {
  const defaultProps = {
    houseId: 'test-house-id',
    mode: 'model' as const,
    pendingChanges: emptyHousePendingChanges,
    onPendingChangesChange: vi.fn(),
    directSave: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers refresh after adding a new shift type in directSave mode', async () => {
    renderWithProviders(<HouseShiftSetup {...defaultProps} />);
    
    // Open dialog
    const addBtn = screen.getByText(/Add Shift Type/i);
    fireEvent.click(addBtn);
    
    // Fill form
    const nameInput = screen.getByPlaceholderText(/e.g. Morning/i);
    fireEvent.change(nameInput, { target: { value: 'New Shift' } });
    
    // Verify localization
    expect(screen.getByText(/Colour Theme/i)).toBeInTheDocument();
    
    // Verify sort order is NOT there
    expect(screen.queryByText(/Sort Order/i)).not.toBeInTheDocument();
    
    // Save
    const saveBtn = screen.getByText(/Add to Model/i);
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(refreshShiftTypesMock).toHaveBeenCalled();
    });
  });

  it('triggers refresh after editing an existing shift type in directSave mode', async () => {
    renderWithProviders(<HouseShiftSetup {...defaultProps} />);
    
    // Find the card for Morning Shift
    const morningShift = screen.getByText('Morning Shift');
    const card = morningShift.closest('div.group');
    if (!card) throw new Error('Card not found');
    
    // Find edit button
    const editBtn = card.querySelector('button svg.lucide-edit')?.parentElement || 
                    card.querySelector('button svg.lucide-square-pen')?.parentElement;
    
    if (!editBtn) {
      // Fallback
      const btns = card.querySelectorAll('button');
      fireEvent.click(btns[0]);
    } else {
      fireEvent.click(editBtn);
    }
    
    // Change name
    const nameInput = screen.getByPlaceholderText(/e.g. Morning/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Shift' } });
    
    // Save
    const updateBtn = screen.getByText(/Update Model/i);
    fireEvent.click(updateBtn);
    
    await waitFor(() => {
      expect(refreshShiftTypesMock).toHaveBeenCalled();
    });
  });
});

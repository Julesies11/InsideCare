import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { HouseShiftSetup } from './house-shift-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }))
  }
}));

vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [
      { id: 'st-1', name: 'Morning', default_start_time: '07:00', default_end_time: '15:00', is_active: true },
    ],
    isLoading: false,
    refresh: vi.fn()
  })
}));

vi.mock('@/hooks/useHouseParticipants', () => ({
  useHouseParticipants: () => ({
    participants: [
      { id: 'p-1', first_name: 'John', last_name: 'Doe', status: 'active' },
      { id: 'p-2', first_name: 'Jane', last_name: 'Smith', status: 'active' }
    ],
    isLoading: false
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

describe('HouseShiftSetup - Participant Linking', () => {
  const defaultProps = {
    houseId: 'test-house-id',
    mode: 'templates' as const,
    pendingChanges: emptyHousePendingChanges,
    onPendingChangesChange: vi.fn(),
    directSave: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active participants in the Shift Item dialog', async () => {
    renderWithProviders(<HouseShiftSetup {...defaultProps} />);
    
    // Open the Shift Item dialog (Add Shift to Template)
    const addShiftBtn = screen.getByText(/Add Shift/i);
    fireEvent.click(addShiftBtn);
    
    // Check if participants are listed
    expect(screen.getByText(/Linked Participants/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('allows selecting participants in the dialog', async () => {
    renderWithProviders(<HouseShiftSetup {...defaultProps} />);
    
    const addShiftBtn = screen.getByText(/Add Shift/i);
    fireEvent.click(addShiftBtn);
    
    const participantCard = screen.getByText(/John Doe/i).closest('div');
    if (participantCard) fireEvent.click(participantCard);
    
    // The badge should update to "1 Linked"
    expect(screen.getByText(/1 Linked/i)).toBeInTheDocument();
  });
});

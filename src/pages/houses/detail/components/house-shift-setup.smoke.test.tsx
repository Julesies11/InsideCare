import { renderWithProviders, screen } from '@/test/test-utils';
import { HouseShiftSetup } from './house-shift-setup';
import { describe, it, expect, vi } from 'vitest';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';

const mockMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

// Mock the hooks used in the component
vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [
      { id: '1', name: 'Morning Shift', default_start_time: '07:00:00', default_end_time: '15:00:00', color_theme: 'morning', icon_name: 'Sun' },
      { id: '2', name: 'Day Shift', default_start_time: '15:00:00', default_end_time: '23:00:00', color_theme: 'day', icon_name: 'CloudSun' }
    ],
    isLoading: false,
    refresh: vi.fn()
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

vi.mock('@/hooks/useHouseParticipants', () => ({
  useHouseParticipants: () => ({
    participants: [],
    isLoading: false
  })
}));

vi.mock('@/components/roster/use-roster-data', () => ({
  useRosterData: () => ({
    materializePattern: vi.fn(),
    materializeTemplate: vi.fn()
  })
}));

describe('HouseShiftSetup Smoke Test', () => {
  it('renders shift model section', () => {
    renderWithProviders(
      <HouseShiftSetup 
        houseId="test-house-id" 
        mode="model"
        pendingChanges={emptyHousePendingChanges}
        onPendingChangesChange={vi.fn()}
      />
    );
    
    expect(screen.getByRole('heading', { name: /shift model/i })).toBeInTheDocument();
    expect(screen.getByText('Morning Shift')).toBeInTheDocument();
    expect(screen.getByText('Day Shift')).toBeInTheDocument();
  });

  it('renders shift templates section', () => {
    renderWithProviders(
      <HouseShiftSetup 
        houseId="test-house-id" 
        mode="templates"
        pendingChanges={emptyHousePendingChanges}
        onPendingChangesChange={vi.fn()}
      />
    );
    
    expect(screen.getByRole('heading', { name: /shift templates/i })).toBeInTheDocument();
    expect(screen.getByText('Standard Weekday')).toBeInTheDocument();
  });
});

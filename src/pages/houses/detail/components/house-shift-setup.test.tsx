import { renderWithProviders, screen } from '@/test/test-utils';
import { HouseShiftSetup } from './house-shift-setup';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the hooks used in HouseShiftSetup
vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [
      { id: 'st-1', name: 'Morning', color_theme: 'morning', icon_name: 'Clock', default_start_time: '07:00:00', default_end_time: '15:00:00' }
    ],
    defaults: [
      { 
        shift_type_id: 'st-1', 
        checklist_id: 'cl-1',
        checklist: {
          id: 'cl-1',
          name: 'Morning Routine',
          items: [
            { id: 'item-1', title: 'Task 1' },
            { id: 'item-2', title: 'Task 2' },
            { id: 'item-3', title: 'Task 3' },
            { id: 'item-4', title: 'Task 4' }
          ]
        }
      }
    ],
    refresh: vi.fn()
  })
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [
      { 
        id: 'cl-1', 
        name: 'Morning Routine',
        items: [
          { id: 'item-1', title: 'Task 1' },
          { id: 'item-2', title: 'Task 2' },
          { id: 'item-3', title: 'Task 3' },
          { id: 'item-4', title: 'Task 4' }
        ]
      }
    ]
  })
}));

vi.mock('@/hooks/useHouseParticipants', () => ({
  useHouseParticipants: () => ({
    participants: []
  })
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [{ id: 'house-1', name: 'Test House' }]
  })
}));

vi.mock('@/components/roster/use-roster-data', () => ({
  useRosterData: () => ({
    materializeTemplate: vi.fn()
  })
}));

describe('HouseShiftSetup', () => {
  it('renders correctly', () => {
    renderWithProviders(<HouseShiftSetup houseId="house-1" />);
    expect(screen.getByText('Shift Model')).toBeDefined();
    expect(screen.getByText('Morning')).toBeDefined();
  });

  it('shows only first 2 checklist items in shift model preview', () => {
    renderWithProviders(<HouseShiftSetup houseId="house-1" />);
    
    // Check for Task 1 and Task 2
    expect(screen.getByText('Task 1')).toBeDefined();
    expect(screen.getByText('Task 2')).toBeDefined();
    
    // Task 3 and Task 4 should NOT be visible
    expect(screen.queryByText('Task 3')).toBeNull();
    expect(screen.queryByText('Task 4')).toBeNull();
    
    // Should show "more" text
    expect(screen.getByText('+ 2 more tasks...')).toBeDefined();
  });
});

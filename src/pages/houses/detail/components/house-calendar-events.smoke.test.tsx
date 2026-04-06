import { renderWithProviders, screen } from '@/test/test-utils';
import { HouseCalendarEvents } from './house-calendar-events';
import { describe, it, expect, vi } from 'vitest';

// Mock the hooks used in HouseCalendarEvents
vi.mock('@/hooks/useHouseCalendarEvents', () => ({
  useHouseCalendarEvents: () => ({
    houseCalendarEvents: [
      { 
        id: 'shift-1', 
        type: 'shift', 
        event_date: '2026-04-05', 
        start_time: '08:00:00', 
        end_time: '16:00:00', 
        shift_type: 'Morning',
        assigned_staff: { name: 'John Doe' },
        assigned_staff_id: 'staff-1',
        type_details: { color_theme: 'morning', icon_name: 'Clock' },
        notes_count: 2
      }
    ],
    loading: false,
    refresh: vi.fn()
  })
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: []
  })
}));

vi.mock('@/hooks/useChecklistSchedules', () => ({
  useChecklistSchedules: () => ({
    deleteSchedule: vi.fn(),
    deleteEvent: vi.fn(),
    loading: false
  })
}));

vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({
    participants: []
  })
}));

vi.mock('@/hooks/use-staff', () => ({
  useStaff: () => ({
    staff: []
  })
}));

vi.mock('@/auth/context/auth-context', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'user-1' },
      isAdmin: true,
      isStaff: true,
    })
  };
});

vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: []
  })
}));

vi.mock('@/components/roster/use-roster-data', () => ({
  useRosterData: () => ({
    createShift: vi.fn(),
    updateShift: vi.fn(),
    deleteShift: vi.fn()
  })
}));

describe('HouseCalendarEvents Smoke Test', () => {
  it('renders without crashing and displays the shift card', () => {
    renderWithProviders(<HouseCalendarEvents houseId="house-1" canDelete={true} />);
    
    // Check for "House Calendar" text
    expect(screen.getByText('House Calendar')).toBeDefined();
    
    // In Month view (default), it should render the ShiftCard
    // mapEventToShiftCardData converts shift-1 to 1 (id), and Morning (shift_type)
    expect(screen.getByText('Morning')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
  });
});

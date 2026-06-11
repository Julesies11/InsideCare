import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { StaffRosterCalendar } from './staff-roster-calendar';

// Mock required hooks and components
vi.mock('@/hooks/use-house-shift-templates', () => ({
  useHouseShiftTemplates: vi.fn(() => ({ shiftTemplates: [] })),
}));

vi.mock('@/components/roster/use-roster-data', () => ({
  useRosterData: vi.fn(() => ({
    houses: [],
    participants: [],
    staff: [],
    createShift: vi.fn(),
    updateShift: vi.fn(),
    deleteShift: vi.fn(),
    addShiftParticipant: vi.fn(),
    syncShiftParticipants: vi.fn(),
    syncShiftChecklists: vi.fn(),
  })),
  useShiftsQuery: vi.fn(() => ({
    shifts: [
      { id: '1', start_time: null, start_date: '2026-06-01' },
      { id: '2', start_time: '10:00', start_date: '2026-06-01' },
    ],
    isLoading: false,
  })),
  useLeaveRequestsQuery: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/api/roster.api', () => ({
  rosterApi: {
    shifts: {
      list: vi.fn(),
    },
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

describe('StaffRosterCalendar', () => {
  it('handles null start_time gracefully during sorting', () => {
    // This test ensures that the component renders even when shifts have null start_time
    // (which previously caused a TypeError with localeCompare)
    render(
      <StaffRosterCalendar
        staffId="test-staff"
        viewMode="day"
        currentDate={new Date('2026-06-01')}
        houseFilter="all"
        participantFilter="all"
        shiftTemplateFilter="all"
        canEdit={true}
        checklists={[]}
      />,
      { wrapper },
    );

    // If it didn't throw, it passed the regression check for the TypeError
    expect(screen.getByText(/Mon/i)).toBeDefined();
  });
});

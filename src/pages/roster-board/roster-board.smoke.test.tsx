import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RosterBoardContent } from './roster-board-content';

// Mock required hooks and components
vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: vi.fn(() => ({
    hasAccess: vi.fn(() => true),
  })),
  ACCESS_LEVEL: {
    CONTEXT_READ_WRITE: 'context_read_write',
  },
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: vi.fn(() => ({ houseChecklists: [] })),
}));

vi.mock('@/components/roster/use-roster-data', () => ({
  useRosterData: vi.fn(() => ({
    houses: [],
    participants: [],
    staff: [],
    loading: false,
    bulkUpdateShifts: vi.fn(),
    bulkDeleteShifts: vi.fn(),
  })),
  useGlobalShiftTemplatesQuery: vi.fn(() => ({ data: [] })),
}));

vi.mock('./components/staff-roster-calendar', () => ({
  StaffRosterCalendar: vi.fn(() => <div data-testid="staff-roster-calendar" />),
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

describe('RosterBoardContent Smoke Test', () => {
  it('renders without crashing', () => {
    render(<RosterBoardContent />, { wrapper });
    expect(screen.getByTestId('staff-roster-calendar')).toBeDefined();
  });
});

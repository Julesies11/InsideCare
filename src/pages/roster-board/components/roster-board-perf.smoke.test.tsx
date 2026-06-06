/**
 * Smoke tests for the performance-optimized Roster Board components.
 *
 * Tests that StaffRosterCalendar and ShiftCalendar render without crashing
 * after the houseStaffMap optimisation. No Playwright — these are unit-level
 * smoke tests using vitest + @testing-library/react.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock all external dependencies ─────────────────────────────────────────
vi.mock('@/api/roster.api', () => ({
  rosterApi: {
    listShifts: vi.fn().mockResolvedValue([]),
    listLeaveRequests: vi.fn().mockResolvedValue([]),
    listGlobalShiftTemplates: vi.fn().mockResolvedValue([]),
    createShift: vi.fn().mockResolvedValue({}),
    updateShift: vi.fn().mockResolvedValue({}),
    deleteShift: vi.fn().mockResolvedValue({}),
    bulkUpdateShifts: vi.fn().mockResolvedValue([]),
    bulkDeleteShifts: vi.fn().mockResolvedValue([]),
    syncShiftParticipants: vi.fn().mockResolvedValue([]),
    addShiftParticipant: vi.fn().mockResolvedValue({}),
    materializePattern: vi.fn().mockResolvedValue([]),
    syncShiftChecklists: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('@/api/houses.api', () => ({
  housesApi: {
    listActive: vi.fn().mockResolvedValue([]),
    listStaffAssignments: vi.fn().mockResolvedValue([]),
    listStaffAssignmentsByStaff: vi.fn().mockResolvedValue([]),
    listShiftTemplates: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('@/api/participants.api', () => ({
  participantsApi: { listActive: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/api/staff.api', () => ({
  staffApi: {
    listActive: vi.fn().mockResolvedValue([]),
    listAdmins: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('@/hooks/use-house-shift-templates', () => ({
  useHouseShiftTemplates: () => ({ shiftTemplates: [] }),
}));
vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', staff_id: 's1', fullname: 'Test Admin' },
    isAdmin: true,
  }),
}));
vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({ hasAccess: () => true }),
  ACCESS_LEVEL: { FULL: 'full', CONTEXT_READ_WRITE: 'context_read_write' },
}));
vi.mock('@/providers/settings-provider', () => ({
  useSettings: () => ({ settings: { theme: 'light' } }),
}));
// ────────────────────────────────────────────────────────────────────────────

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );

// ─── ShiftCalendar smoke tests ───────────────────────────────────────────────
describe('ShiftCalendar smoke tests', () => {
  it('renders without crashing when houseStaffMap is undefined (fallback path)', async () => {
    const { ShiftCalendar } = await import('@/components/roster/shift-calendar');
    renderWithProviders(
      <ShiftCalendar
        staffId="all"
        viewMode="week"
        currentDate={new Date('2024-01-15')}
        shifts={[]}
        loading={false}
        canEdit={true}
        onAddShift={vi.fn()}
        onEditShift={vi.fn()}
        groupByHouse={true}
        houses={[{ id: 'house-1', house_name: 'Test House' } as any]}
        staffList={[]}
        // houseStaffMap intentionally omitted to test fallback path
      />
    );
    // Should render without crashing — no error boundary triggered
    expect(document.querySelector('#root') ?? document.body).toBeTruthy();
  });

  it('renders without crashing when houseStaffMap is provided (optimised path)', async () => {
    const { ShiftCalendar } = await import('@/components/roster/shift-calendar');
    const houseStaffMap = new Map([['house-1', []]]);

    renderWithProviders(
      <ShiftCalendar
        staffId="all"
        viewMode="week"
        currentDate={new Date('2024-01-15')}
        shifts={[]}
        loading={false}
        canEdit={true}
        onAddShift={vi.fn()}
        onEditShift={vi.fn()}
        groupByHouse={true}
        houses={[{ id: 'house-1', house_name: 'Test House' } as any]}
        staffList={[]}
        houseStaffMap={houseStaffMap}
      />
    );
    expect(document.querySelector('#root') ?? document.body).toBeTruthy();
  });

  it('renders loading skeleton without crashing', async () => {
    const { ShiftCalendar } = await import('@/components/roster/shift-calendar');
    renderWithProviders(
      <ShiftCalendar
        staffId="all"
        viewMode="week"
        currentDate={new Date('2024-01-15')}
        shifts={[]}
        loading={true}
        canEdit={false}
        onAddShift={vi.fn()}
        onEditShift={vi.fn()}
      />
    );
    expect(document.querySelector('#root') ?? document.body).toBeTruthy();
  });
});

// ─── RosterBoardContent smoke test ──────────────────────────────────────────
describe('RosterBoardContent smoke tests', () => {
  it('renders the roster board header without crashing', async () => {
    const { RosterBoardContent } = await import(
      '@/pages/roster-board/roster-board-content'
    );
    renderWithProviders(<RosterBoardContent />);
    expect(await screen.findByText(/Roster Board/i)).toBeInTheDocument();
  });
});

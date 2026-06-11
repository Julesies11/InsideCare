import { HomePage as DashboardPage } from '@/pages/dashboards/home/home-page';
import { AdminLeaveRequestsPage } from '@/pages/employees/leave-requests/admin-leave-requests-page';
import { StaffProfilesPage as StaffProfiles } from '@/pages/employees/staff-profiles/staff-profiles-page';
import { AdminTimesheetsPage } from '@/pages/employees/timesheets/admin-timesheets-page';
import { HousesProfilesPage as HouseProfiles } from '@/pages/houses/profiles/houses-basic-page';
import RosterBoard from '@/pages/roster-board';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from './test-utils';

// Mock Supabase with a more robust chainable mock
vi.mock('@/lib/supabase', () => {
  const mockResult = Promise.resolve({ data: [], error: null, count: 0 });

  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue(Promise.resolve({ data: {}, error: null })),
    maybeSingle: vi
      .fn()
      .mockReturnValue(Promise.resolve({ data: null, error: null })),
    then: (onFulfilled: any) => mockResult.then(onFulfilled),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({ data: { user: { id: '1' } }, error: null }),
        ),
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: null }, error: null }),
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      functions: {
        invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      },
    },
  };
});

describe('Smoke Tests - Admin Pages', () => {
  it('Dashboard loads without crashing', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Welcome to InsideCare/i)).toBeDefined();
  });

  it('Staff Profiles loads without crashing', () => {
    renderWithProviders(<StaffProfiles />);
    expect(screen.getByText(/Staff Profiles/i)).toBeDefined();
  });

  it('Admin Timesheets loads without crashing', () => {
    renderWithProviders(<AdminTimesheetsPage />);
    expect(screen.getAllByText(/Timesheets/i).length).toBeGreaterThan(0);
  });

  it('Admin Leave Requests loads without crashing', () => {
    renderWithProviders(<AdminLeaveRequestsPage />);
    expect(screen.getAllByText(/Leave Requests/i).length).toBeGreaterThan(0);
  });

  it('House Profiles loads without crashing', () => {
    renderWithProviders(<HouseProfiles />);
    expect(screen.getByText(/House Management/i)).toBeDefined();
  });

  it('Roster Board loads without crashing', () => {
    renderWithProviders(<RosterBoard />);
    expect(screen.getByText(/Roster Board/i)).toBeDefined();
  });
});

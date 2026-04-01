import { renderWithProviders, screen } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '@/pages/dashboards/home/dashboard-page';
import { StaffProfiles } from '@/pages/employees/staff-profiles/staff';
import { AdminTimesheetsPage } from '@/pages/employees/timesheets/admin-timesheets-page';
import { AdminLeaveRequestsPage } from '@/pages/employees/leave-requests/admin-leave-requests-page';
import { HouseProfiles } from '@/pages/houses/profiles/houses';
import { RosterBoard } from '@/pages/roster-board/roster-board';

// Mock Supabase to avoid network calls
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '1' } }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null }))
    }
  }
}));

describe('Smoke Tests - Admin Pages', () => {
  it('Dashboard loads without crashing', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Dashboard/i)).toBeDefined();
  });

  it('Staff Profiles loads without crashing', () => {
    renderWithProviders(<StaffProfiles />);
    // DataGrid should render or at least some part of the page
    expect(screen.getByText(/Staff/i)).toBeDefined();
  });

  it('Admin Timesheets loads without crashing', () => {
    renderWithProviders(<AdminTimesheetsPage />);
    expect(screen.getByText(/Timesheets/i)).toBeDefined();
  });

  it('Admin Leave Requests loads without crashing', () => {
    renderWithProviders(<AdminLeaveRequestsPage />);
    expect(screen.getByText(/Leave Requests/i)).toBeDefined();
  });

  it('House Profiles loads without crashing', () => {
    renderWithProviders(<HouseProfiles />);
    expect(screen.getByText(/House Profiles/i)).toBeDefined();
  });

  it('Roster Board loads without crashing', () => {
    renderWithProviders(<RosterBoard />);
    expect(screen.getByText(/Roster Board/i)).toBeDefined();
  });
});

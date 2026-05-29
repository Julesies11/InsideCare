import { renderWithProviders, screen } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { AdminLeaveRequestsPage } from '@/pages/employees/leave-requests/admin-leave-requests-page';
import { AdminTimesheetsPage } from '@/pages/employees/timesheets/admin-timesheets-page';
import { StaffTimesheetList } from '@/pages/staff/staff-timesheet-list';
import { HouseChecklistHistory } from '@/pages/houses/detail/components/house-checklist-history';
import { HouseCalendarEvents } from '@/pages/houses/detail/components/house-calendar-events';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
    single: vi.fn().mockReturnValue(Promise.resolve({ data: {}, error: null })),
    then: (onFulfilled: (res: { data: any[]; error: any }) => any) => Promise.resolve({ data: [], error: null }).then(onFulfilled),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://test.com' }, error: null })),
        }))
      }
    }
  };
});

describe('Join Fixes Smoke Tests', () => {
  it('Admin Leave Requests Page renders without crashing', async () => {
    renderWithProviders(<AdminLeaveRequestsPage />);
    expect(screen.getByText(/Leave Requests/i)).toBeDefined();
  });

  it('Admin Timesheets Page renders without crashing', async () => {
    renderWithProviders(<AdminTimesheetsPage />);
    expect(screen.getAllByText(/Timesheets/i).length).toBeGreaterThan(0);
  });

  it('Staff Timesheet List renders without crashing', async () => {
    renderWithProviders(<StaffTimesheetList />);
    expect(screen.getByText(/My Timesheets/i)).toBeDefined();
  });

  it('House Checklist History component renders', async () => {
    renderWithProviders(
      <HouseChecklistHistory houseId="test-house" />
    );
    expect(screen.getByText(/Checklist History/i)).toBeDefined();
  });

  it('House Calendar Events component renders', async () => {
    renderWithProviders(
      <HouseCalendarEvents 
        houseId="test-house" 
        canEdit={true} 
        canDelete={true} 
      />
    );
    expect(screen.getByText(/House Calendar/i)).toBeDefined();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaffDashboard } from '@/pages/staff/staff-dashboard';
import { StaffTimesheetList } from '@/pages/staff/staff-timesheet-list';
import { HousesProfilesContent } from '@/pages/houses/profiles/houses-basic-content';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all DAL modules
vi.mock('@/api/staff.api', () => ({ 
  staffApi: { 
    getDashboardData: vi.fn().mockResolvedValue({ upcomingSchedule: [], pendingLeave: [], pendingTimesheets: [] }),
    listAdmins: vi.fn().mockResolvedValue([])
  } 
}));
vi.mock('@/api/timesheets.api', () => ({ 
  timesheetsApi: { 
    listByStaff: vi.fn().mockResolvedValue([]) 
  } 
}));
vi.mock('@/api/houses.api', () => ({ 
  housesApi: { 
    listActive: vi.fn().mockResolvedValue([]), 
    listWithTemplates: vi.fn().mockResolvedValue([]),
    listForms: vi.fn().mockResolvedValue([])
  } 
}));
vi.mock('@/api/roster.api', () => ({ 
  rosterApi: { 
    listShifts: vi.fn().mockResolvedValue([]),
    listLeaveRequests: vi.fn().mockResolvedValue([])
  } 
}));

// Mock Auth & RBAC
vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', staff_id: 's1', fullname: 'Test User' } })
}));
vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({ hasAccess: () => true }),
  ACCESS_LEVEL: { FULL: 'full', CONTEXT_READ_WRITE: 'context_read_write' }
}));
vi.mock('@/providers/settings-provider', () => ({
  useSettings: () => ({ settings: { theme: 'light' } })
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('UI Smoke Tests - Stability Check', () => {
  it('StaffDashboard renders without crashing', async () => {
    renderWithProviders(<StaffDashboard />);
    expect(await screen.findAllByText(/welcome/i)).toBeDefined();
  });

  it('StaffTimesheetList renders without crashing', async () => {
    renderWithProviders(<StaffTimesheetList />);
    expect(await screen.findAllByText(/timesheets/i)).toBeDefined();
  });

  it('HousesProfilesContent renders without crashing', async () => {
    renderWithProviders(<HousesProfilesContent />);
    expect(await screen.findAllByText(/management/i)).toBeDefined();
  });
});

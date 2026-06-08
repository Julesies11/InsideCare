import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { StaffRoster, StaffChecklists, StaffLeaveList, StaffLeaveForm, StaffDashboard, StaffTimesheetList, StaffTimesheetForm, StaffProfile } from './index';
import { describe, it, expect, vi } from 'vitest';

// Mock useNavigate and useParams
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ shiftId: 'test-shift' }),
    useLocation: () => ({ 
      pathname: '/my-roster',
      state: { fromTab: 'missing' } 
    }),
  };
});

// Mock Supabase to return empty data
vi.mock('@/lib/supabase', () => {
  const mockResult = { data: [], error: null };
  const mockSingleResult = { data: null, error: null };
  
  const queryBuilder: any = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    neq: vi.fn(() => queryBuilder),
    not: vi.fn(() => queryBuilder),
    in: vi.fn(() => queryBuilder),
    gte: vi.fn(() => queryBuilder),
    lte: vi.fn(() => queryBuilder),
    order: vi.fn(() => queryBuilder),
    range: vi.fn(() => queryBuilder),
    maybeSingle: vi.fn(() => Promise.resolve(mockSingleResult)),
    single: vi.fn(() => Promise.resolve(mockSingleResult)),
    then: (resolve: any) => resolve(mockResult),
  };

  return {
    supabase: {
      from: vi.fn(() => queryBuilder),
    }
  };
});

describe('Staff Pages Smoke Tests', () => {
  it('renders Staff Dashboard without crashing', async () => {
    renderWithProviders(<StaffDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Upcoming Schedule/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Timesheet List without crashing', async () => {
    renderWithProviders(<StaffTimesheetList />);
    await waitFor(() => {
      expect(screen.getByText(/My Timesheets/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Roster without crashing', async () => {
    renderWithProviders(<StaffRoster />);
    await waitFor(() => {
      expect(screen.getByText(/My Roster/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Checklists without crashing', async () => {
    renderWithProviders(<StaffChecklists />);
    await waitFor(() => {
      // Look for page title or section header
      expect(screen.getByText(/House Checklists/i)).toBeInTheDocument();
      expect(screen.getByText(/Today's Tasks/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Leave List without crashing', async () => {
    renderWithProviders(<StaffLeaveList />);
    await waitFor(() => {
      // Use getAllByText and check for first one to avoid "found multiple" error
      expect(screen.getAllByText(/Leave Requests/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/No leave requests yet/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Leave Form without crashing', async () => {
    renderWithProviders(<StaffLeaveForm open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/New Leave Request/i)).toBeInTheDocument();
      expect(screen.getByText(/Submit Request/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Timesheet Form without crashing', async () => {
    renderWithProviders(<StaffTimesheetForm />);
    await waitFor(() => {
      expect(screen.getByText(/Shift not found/i)).toBeInTheDocument();
    });
  });

  it('renders Staff Profile without crashing', async () => {
    renderWithProviders(<StaffProfile />);
    await waitFor(() => {
      expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/Account Security/i)).toBeInTheDocument();
    });
  });
});

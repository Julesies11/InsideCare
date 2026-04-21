import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { StaffRoster, StaffChecklists, StaffLeaveList, StaffLeaveForm, StaffDashboard, StaffTimesheetList } from './index';
import { describe, it, expect, vi } from 'vitest';

// Mock useNavigate and useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: undefined }),
  };
});

// Mock Supabase to return empty data
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

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
      // It might show "Dashboard" or "Checklists" depending on state
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
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
});

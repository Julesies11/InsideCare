import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StaffDashboard } from './staff-dashboard';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { format } from 'date-fns';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const today = format(new Date(), 'yyyy-MM-dd');

const mockShifts = [
  {
    id: 'shift-1',
    start_date: today,
    start_time: '00:00',
    end_time: '23:59',
    house: { id: 'house-1', name: 'Test House' },
    assigned_checklists: [
      {
        checklist_id: 'cl-1',
        submissions: [{ shift_id: 'shift-1', status: 'completed' }]
      },
      {
        checklist_id: 'cl-2',
        submissions: []
      },
      {
        checklist_id: 'cl-3',
        submissions: []
      }
    ]
  },
];

const mockLeave = [
  {
    id: 'leave-1',
    leave_type: { name: 'Annual Leave' },
    start_date: '2026-03-10',
    end_date: '2026-03-12',
    status: 'pending',
  },
];

const mockTimesheets = [
  {
    id: 'ts-1',
    status: 'draft',
    clock_in: '2026-03-04T08:00:00Z',
    shift: { start_date: '2026-03-04' },
  },
];

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('StaffDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ensure mock shift always matches the current real local date and time
    const localToday = format(new Date(), 'yyyy-MM-dd');
    const mockShiftsWithCurrentDate = [{
      ...mockShifts[0],
      start_date: localToday,
      start_time: '00:00',
      end_time: '23:59'
    }];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json(mockShiftsWithCurrentDate);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json(mockLeave);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => {
        return HttpResponse.json(mockTimesheets);
      })
    );
  });

  it('renders the dashboard with upcoming schedule, leave, and timesheets', async () => {
    renderWithProviders(<StaffDashboard />);

    // Check headings
    expect(screen.getByRole('heading', { name: /upcoming schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /leave requests/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /timesheets/i })).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByText(/Test House/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Annual Leave/)).toBeInTheDocument();
      expect(screen.getByText(/1 draft/i)).toBeInTheDocument();
    });
  });

  it('renders checklist progress for active shift', async () => {
    renderWithProviders(<StaffDashboard />);

    await waitFor(() => {
      // Check for the active shift section
      expect(screen.getByText(/Active Shift/i)).toBeInTheDocument();
      
      // Verify progress section exists via test-id
      const progressSection = screen.getByTestId('shift-checklist-progress');
      expect(progressSection).toBeInTheDocument();
      expect(progressSection.textContent).toContain('1 / 3');
      expect(progressSection.textContent).toContain('33%');
    });
  });

  it('renders empty states when no data is returned', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => HttpResponse.json([]))
    );

    renderWithProviders(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no upcoming commitments/i)).toBeInTheDocument();
      expect(screen.getByText(/no active leave requests/i)).toBeInTheDocument();
      expect(screen.getByText(/no timesheets awaiting action/i)).toBeInTheDocument();
    });
  });

  it('renders quick action buttons', () => {
    renderWithProviders(<StaffDashboard />);

    expect(screen.getByRole('button', { name: /request leave/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my timesheets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view roster/i })).toBeInTheDocument();
  });
});

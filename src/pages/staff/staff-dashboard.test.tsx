import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StaffDashboard } from './staff-dashboard';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockShifts = [
  {
    id: 'shift-1',
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    start_time: '08:00:00',
    end_time: '16:00:00',
    house: { name: 'Test House' },
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
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json(mockShifts);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json(mockLeave);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => {
        return HttpResponse.json(mockTimesheets);
      })
    );
  });

  it('renders the dashboard with upcoming shifts, leave, and timesheets', async () => {
    renderWithProviders(<StaffDashboard />);

    // Check headings
    expect(screen.getByRole('heading', { name: /upcoming shifts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /leave requests/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /timesheets/i })).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Test House/)).toBeInTheDocument();
      expect(screen.getByText(/Annual Leave/)).toBeInTheDocument();
      expect(screen.getByText(/1 draft/i)).toBeInTheDocument();
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
      expect(screen.getByText(/no upcoming shifts/i)).toBeInTheDocument();
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

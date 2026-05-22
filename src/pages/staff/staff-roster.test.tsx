import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StaffRoster } from './staff-roster';
import { renderWithProviders } from '@/test/test-utils';
import { TABLES } from '@/config/db-tables';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockEntries = [
  {
    id: 'shift-1',
    start_date: '2026-04-10',
    start_time: '10:00:00',
    end_time: '14:00:00',
    shift_template: 'Standard',
    house: { name: 'House A' }
  },
  {
    id: 'event-1',
    title: 'Client Meeting',
    event_date: '2026-04-10',
    start_time: '09:00:00',
    end_time: '09:30:00',
    location: 'Office',
    type: { name: 'Meeting', color: 'blue' },
    house: { name: 'House A' },
    staff_assignments: [{ staff_id: 'staff-1' }]
  },
  {
    id: 'leave-1',
    start_date: '2026-04-12',
    end_date: '2026-04-13',
    status: 'approved',
    reason: 'Family event',
    leave_type: { name: 'Personal Leave' }
  }
];

// Mock useNavigate
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('StaffRoster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, () => HttpResponse.json([mockEntries[0]])),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_CALENDAR_EVENTS}`, () => HttpResponse.json([mockEntries[1]])),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_REQUESTS}`, () => HttpResponse.json([mockEntries[2]])),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => HttpResponse.json([]))
    );
  });

  it('renders the roster calendar by default', async () => {
    renderWithProviders(<StaffRoster />);
    expect(screen.getByText(/my roster/i)).toBeInTheDocument();
    
    // In calendar view, we should see the Today/Week/Month buttons
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /week/i, exact: true })).toBeInTheDocument();
  });

  it('renders the list view with shifts, events, and leave', async () => {
    const { user } = renderWithProviders(<StaffRoster />);
    
    // Switch to list tab
    const listTab = screen.getByRole('button', { name: /list/i });
    await user.click(listTab);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Client Meeting/)).toBeInTheDocument();
      expect(screen.getByText(/Standard/)).toBeInTheDocument();
      expect(screen.getByText(/Family event/)).toBeInTheDocument();
      expect(screen.getByText(/3 items/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no data is returned in list view', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_CALENDAR_EVENTS}`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_REQUESTS}`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => HttpResponse.json([]))
    );

    const { user } = renderWithProviders(<StaffRoster />);
    
    // Switch to list tab
    const listTab = screen.getByRole('button', { name: /list/i });
    await user.click(listTab);

    await waitFor(() => {
      expect(screen.getByText(/no commitments found/i)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StaffRoster } from './staff-roster';
import { renderWithProviders } from '@/test/test-utils';
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
  }
];

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('StaffRoster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => HttpResponse.json([mockEntries[0]])),
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => HttpResponse.json([mockEntries[1]])),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => HttpResponse.json([]))
    );
  });

  it('renders the roster calendar by default', async () => {
    renderWithProviders(<StaffRoster />);
    expect(screen.getByText(/my roster/i)).toBeInTheDocument();
    
    // In calendar view, we should see the Today/Week/Month buttons
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /week/i, exact: true })).toBeInTheDocument();
  });

  it('renders the list view with shifts and events', async () => {
    const { user } = renderWithProviders(<StaffRoster />);
    
    // Switch to list tab
    const listTab = screen.getByRole('button', { name: /list/i });
    await user.click(listTab);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Client Meeting/)).toBeInTheDocument();
      expect(screen.getByText(/Standard/)).toBeInTheDocument();
      expect(screen.getByText(/2 items/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no data is returned in list view', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => HttpResponse.json([]))
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

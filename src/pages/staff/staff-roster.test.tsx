import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { StaffRoster } from './staff-roster';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockShifts = [
  {
    id: 'shift-1',
    start_date: '2026-04-10',
    start_time: '10:00:00',
    end_time: '14:00:00',
    shift_template: 'Standard',
    house: { house_name: 'House A' },
  },
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
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, () => {
        return HttpResponse.json(mockShifts, {
          headers: {
            'content-range': '0-0/1',
          },
        });
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_CALENDAR_EVENTS}`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_REQUESTS}`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.SHIFT_NOTES}`, () =>
        HttpResponse.json([]),
      ),
    );
  });

  it('renders the roster calendar by default', async () => {
    renderWithProviders(<StaffRoster />);
    expect(screen.getByText(/my roster/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
  });

  it('renders the list view with shifts and search box', async () => {
    const { user } = renderWithProviders(<StaffRoster />);

    // Switch to list tab
    const listTab = screen.getByRole('button', { name: /list/i });
    await user.click(listTab);

    // Wait for data to load in DataGrid
    await waitFor(() => {
      expect(screen.getByText(/Standard/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search shifts/i)).toBeInTheDocument();
    });
  });

  it('performs search in list view', async () => {
    const { user } = renderWithProviders(<StaffRoster />);

    // Switch to list tab
    await user.click(screen.getByRole('button', { name: /list/i }));

    const searchInput = screen.getByPlaceholderText(/search shifts/i);
    await user.type(searchInput, 'Morning');

    // Verification would ideally check if API was called with search param
    // In this unit test, we just verify the input value changed
    expect(searchInput).toHaveValue('Morning');
  });
});

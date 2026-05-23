import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AdminTimesheetsPage } from './admin-timesheets-page';
import { renderWithProviders } from '@/test/test-utils';
import { TABLES } from '@/config/db-tables';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { TimesheetRow, StaffRow, ShiftRow, HouseRow } from '@/test/type-helpers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockTimesheet: Partial<TimesheetRow> & { 
  staff: Partial<StaffRow>, 
  shift: Partial<ShiftRow> & { house: Partial<HouseRow> } 
} = {
  id: 'ts-1',
  staff_id: 'staff-1',
  shift_id: 'shift-1',
  clock_in: '2024-01-01T09:00:00Z',
  clock_out: '2024-01-01T17:00:00Z',
  break_minutes: 30,
  shift_notes_text: 'Worked well',
  status: 'pending',
  submitted_at: '2024-01-01T17:05:00Z',
  incident_tag: false,
  sick_shift: false,
  overtime_hours: 0,
  travel_km: 0,
  created_at: '2024-01-01T17:05:00Z',
  staff: { id: 'staff-1', staff_name: 'John Doe', auth_user_id: 'user-1' },
  shift: {
    start_date: '2024-01-01',
    start_time: '09:00:00',
    end_time: '17:00:00',
    shift_template: 'day',
    house: { house_name: 'Sunset House' },
  },
};

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

describe('AdminTimesheetsPage', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => {
        return HttpResponse.json([mockTimesheet]);
      }),
      http.patch(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => {
        return HttpResponse.json({ ...mockTimesheet, status: 'approved' });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/${TABLES.NOTIFICATIONS}`, () => {
        return HttpResponse.json({});
      })
    );
  });

  it('renders the page and loads timesheets', async () => {
    renderWithProviders(<AdminTimesheetsPage />);

    expect(screen.getByRole('heading', { name: /timesheets/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Sunset House')).toBeInTheDocument();
    });
  });

  it('allows approving a timesheet', async () => {
    const { user } = renderWithProviders(<AdminTimesheetsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /approve/i });
    await user.click(approveBtn);

    // Should open the sheet
    expect(screen.getByText('Approve Timesheet')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirm approve/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText('Approve Timesheet')).not.toBeInTheDocument();
    });
  });

  it('filters by search text', async () => {
    const { user } = renderWithProviders(<AdminTimesheetsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search staff or location/i);
    await user.type(searchInput, 'NonExistent');

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText(/no timesheets found/i)).toBeInTheDocument();
    });
  });
});

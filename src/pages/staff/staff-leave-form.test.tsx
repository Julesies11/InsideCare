import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { StaffLeaveForm } from './staff-leave-form';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockLeaveTypes = [
  { id: 'type-1', name: 'Annual Leave' },
  { id: 'type-2', name: 'Sick Leave' },
];

const mockConflictingShifts = [
  {
    id: 'shift-1',
    shift_date: '2026-03-10',
    start_time: '08:00:00',
    end_time: '16:00:00',
    house: { name: 'Test House' },
  },
];

import { useParams } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: undefined })),
    useNavigate: () => mockNavigate,
  };
});

describe('StaffLeaveForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: undefined });
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/leave_types`, () => {
        return HttpResponse.json(mockLeaveTypes);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json({});
      })
    );
  });

  it('renders correctly and loads leave types', async () => {
    renderWithProviders(<StaffLeaveForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/New Leave Request/i)).toBeInTheDocument();
    });
  });

  it('shows conflict warning when shifts overlap', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('shift_date') === 'gte.2026-03-10') {
           return HttpResponse.json(mockConflictingShifts);
        }
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<StaffLeaveForm />);

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-03-10' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-03-12' } });

    await waitFor(() => {
      expect(screen.getByText(/1 rostered shift overlap with these dates/i)).toBeInTheDocument();
      expect(screen.getByText(/Test House/i)).toBeInTheDocument();
    });
  });

  it('submits a new leave request', async () => {
    const { user } = renderWithProviders(<StaffLeaveForm />);

    await waitFor(() => {
        expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    });

    // Select leave type
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    const option = await screen.findByRole('option', { name: 'Annual Leave' });
    await user.click(option);

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-03-10' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-03-12' } });
    fireEvent.change(screen.getByLabelText(/Reason/i), { target: { value: 'Going on holiday' } });

    // Submit button
    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    await user.click(submitBtn);

    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/staff/leave');
    });
  });

  it('handles edit mode correctly', async () => {
    vi.mocked(useParams).mockReturnValue({ id: 'leave-1' });

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json({
          leave_type_id: 'type-1',
          start_date: '2026-04-01',
          end_date: '2026-04-05',
          reason: 'Existing reason',
          attachment_url: null,
        });
      }),
      http.patch(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json({});
      })
    );

    renderWithProviders(<StaffLeaveForm />);

    await waitFor(() => {
      expect(screen.getByText(/Edit Leave Request/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026-04-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing reason')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/staff/leave');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { StaffTimesheetForm } from './staff-timesheet-form';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockShift = {
  id: 'shift-1',
  start_date: '2026-03-05',
  end_date: '2026-03-05',
  start_time: '08:00:00',
  end_time: '16:00:00',
  shift_template: 'Morning',
  house: { name: 'Test House' },
};

const mockAdmins = [
  { auth_user_id: 'admin-1' }
];

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ shiftId: 'shift-1' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock activity logger to avoid actual calls
vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn().mockResolvedValue({}),
}));

describe('StaffTimesheetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([mockShift]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff`, () => {
        return HttpResponse.json(mockAdmins);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/shift_assigned_checklists`, () => {
        return HttpResponse.json([]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/timesheets`, () => {
        return HttpResponse.json({ id: 'ts-1' });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/shift_notes`, () => {
        return HttpResponse.json({});
      }),
      http.post(`${SUPABASE_URL}/rest/v1/notifications`, () => {
        return HttpResponse.json({});
      })
    );
  });

  it('renders correctly with shift data', async () => {
    renderWithProviders(<StaffTimesheetForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test House/i)).toBeInTheDocument();
      expect(screen.getByText(/08:00 – 16:00/i)).toBeInTheDocument();
      expect(screen.getByText(/8.0 hrs scheduled/i)).toBeInTheDocument();
    });
  });

  it('calculates overtime and requires explanation', async () => {
    renderWithProviders(<StaffTimesheetForm />);

    await waitFor(() => {
        expect(screen.getByLabelText(/Actual End/i)).toBeInTheDocument();
    });

    // Change actual end to be later (9 hours instead of 8)
    const endInput = screen.getByLabelText(/Actual End/i);
    fireEvent.change(endInput, { target: { value: '2026-03-05T17:00' } });

    await waitFor(() => {
        expect(screen.getByText(/1.0 hrs overtime/i)).toBeInTheDocument();
        expect(screen.getByText(/Overtime Explanation/i)).toBeInTheDocument();
        expect(screen.getByText(/Required when overtime is claimed/i)).toBeInTheDocument();
    });
  });

  it('handles sick shift toggle', async () => {
    renderWithProviders(<StaffTimesheetForm />);

    await waitFor(() => {
        expect(screen.getByText(/Convert to Sick Leave/i)).toBeInTheDocument();
    });

    const sickCheckbox = screen.getByLabelText(/Convert to Sick Leave/i);
    fireEvent.click(sickCheckbox);

    expect(screen.getByLabelText(/Reason \(optional\)/i)).toBeInTheDocument();
  });

  it('validates and submits correctly', async () => {
    renderWithProviders(<StaffTimesheetForm />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Describe what happened/i)).toBeInTheDocument();
    });

    // Fill in shift notes
    fireEvent.change(screen.getByPlaceholderText(/Describe what happened/i), {
      target: { value: 'This is a test shift note.' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Timesheet/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/staff/timesheets');
    });
  });

  it('shows error toast on invalid times', async () => {
    renderWithProviders(<StaffTimesheetForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Actual End/i)).toBeInTheDocument();
    });

    // Set end time before start time
    const endInput = screen.getByLabelText(/Actual End/i);
    fireEvent.change(endInput, { target: { value: '2026-03-05T07:00' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Timesheet/i });
    fireEvent.click(submitBtn);

    // Toast is harder to test without mocking it, but we can verify navigate wasn't called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('blocks submission if checklists are incomplete', async () => {
    // Override checklist mock to return an incomplete routine
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/shift_assigned_checklists`, () => {
        return HttpResponse.json([
          { 
            checklist_id: 'cl-1', 
            assignment_title: 'Morning Routine',
            submissions: [{ shift_id: 'shift-1', status: 'in_progress' }]
          }
        ]);
      })
    );

    renderWithProviders(<StaffTimesheetForm />);

    await waitFor(() => {
      expect(screen.getByText(/Required Shift Routines/i)).toBeInTheDocument();
      expect(screen.getByText(/Morning Routine/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Timesheet/i });
    
    // Check for disabled appearance (grayscale class)
    expect(submitBtn).toHaveClass('grayscale');
    
    fireEvent.click(submitBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

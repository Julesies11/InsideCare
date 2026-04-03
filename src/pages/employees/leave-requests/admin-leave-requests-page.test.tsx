import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AdminLeaveRequestsPage } from './admin-leave-requests-page';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockLeaveRequest = {
  id: 'leave-1',
  staff_id: 'staff-2',
  leave_type_id: 'lt-1',
  start_date: '2024-02-01',
  end_date: '2024-02-05',
  reason: 'Family holiday',
  status: 'pending',
  admin_notes: null,
  attachment_url: null,
  created_at: '2024-01-15T10:00:00Z',
  staff: { id: 'staff-2', name: 'Jane Smith', auth_user_id: 'user-2' },
  leave_type: { name: 'Annual Leave' },
};

describe('AdminLeaveRequestsPage', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json([mockLeaveRequest]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([
          { id: 'shift-1', staff_id: 'staff-2', start_date: '2024-02-02' }
        ]);
      }),
      http.patch(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json({ ...mockLeaveRequest, status: 'approved' });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/notifications`, () => {
        return HttpResponse.json({});
      })
    );
  });

  it('renders the page and loads leave requests', async () => {
    renderWithProviders(<AdminLeaveRequestsPage />);

    expect(screen.getByRole('heading', { name: /leave requests/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    });
  });

  it('allows approving a leave request', async () => {
    const { user } = renderWithProviders(<AdminLeaveRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /approve/i });
    await user.click(approveBtn);

    // Should open the dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/approve leave request/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^approve$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows conflicts if any', async () => {
    renderWithProviders(<AdminLeaveRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('1 shift')).toBeInTheDocument();
    });
  });
});

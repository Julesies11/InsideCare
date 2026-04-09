import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStaffDashboardData } from './use-staff-dashboard-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { format, subDays } from 'date-fns';
import { ReactNode } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useStaffDashboardData', () => {
  const staffId = 'staff-1';
  const today = format(new Date(), 'yyyy-MM-dd');
  const lastWeek = subDays(new Date(), 7).toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and merges shifts and events into upcomingSchedule', async () => {
    const mockShifts = [
      {
        id: 'shift-1',
        start_date: today,
        start_time: '10:00:00',
        end_time: '14:00:00',
        house: { id: 'house-1', name: 'House A' },
        assigned_checklists: []
      }
    ];

    const mockEvents = [
      {
        id: 'event-1',
        title: 'Community Outing',
        event_date: today,
        start_time: '09:00:00',
        end_time: '11:00:00',
        location: 'Park',
        type: { name: 'Community', color: 'green' },
        house: { name: 'House A' },
        staff_assignments: [{ staff_id: staffId }]
      }
    ];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => HttpResponse.json(mockShifts)),
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => HttpResponse.json(mockEvents)),
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => HttpResponse.json([]))
    );

    const { result } = renderHook(() => useStaffDashboardData(staffId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const schedule = result.current.data?.upcomingSchedule;
    expect(schedule).toHaveLength(2);
    
    // Sorted by time: Event (09:00) then Shift (10:00)
    expect(schedule[0].entry_type).toBe('event');
    expect(schedule[0].title).toBe('Community Outing');
    expect(schedule[1].entry_type).toBe('shift');
    expect(schedule[1].id).toBe('shift-1');
  });

  it('handles empty results gracefully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => HttpResponse.json([]))
    );

    const { result } = renderHook(() => useStaffDashboardData(staffId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.upcomingSchedule).toHaveLength(0);
  });
});

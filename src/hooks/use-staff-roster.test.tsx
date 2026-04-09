import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStaffRoster } from './use-staff-roster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
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

describe('useStaffRoster', () => {
  const staffId = 'staff-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and merges shifts and events', async () => {
    const mockShifts = [
      {
        id: 'shift-1',
        start_date: '2026-04-10',
        start_time: '10:00:00',
        end_time: '14:00:00',
        shift_template: 'Standard',
        house: { name: 'House A' }
      }
    ];

    const mockEvents = [
      {
        id: 'event-1',
        title: 'Meeting',
        event_date: '2026-04-10',
        start_time: '09:00:00',
        end_time: '09:30:00',
        location: 'Office',
        type: { name: 'Meeting', color: 'blue' },
        house: { name: 'House A' },
        staff_assignments: [{ staff_id: staffId }]
      }
    ];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => HttpResponse.json(mockShifts)),
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => HttpResponse.json(mockEvents)),
      http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => HttpResponse.json([]))
    );

    const { result } = renderHook(() => useStaffRoster(staffId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const entries = result.current.data;
    expect(entries).toHaveLength(2);
    
    // Sorted by date descending, then time descending (as per my implementation)
    // April 10 10:00 (Shift) should be first, April 10 09:00 (Event) second
    expect(entries[0].entry_type).toBe('shift');
    expect(entries[1].entry_type).toBe('event');
    expect(entries[1].title).toBe('Meeting');
  });
});

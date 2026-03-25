import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseCalendarEvents } from './useHouseCalendarEvents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useHouseCalendarEvents Integration', () => {
  it('should combine regular events, shifts, and shift checklists', async () => {
    server.use(
      // 1. Mock regular calendar events
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => {
        return HttpResponse.json([
          { 
            id: 'evt-1', 
            house_id: 'house-1', 
            title: 'House Meeting', 
            type: 'meeting',
            event_date: '2026-03-23', 
            status: 'scheduled'
          },
        ]);
      }),
      // 2. Mock staff shifts
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([
          { 
            id: 'shift-1', 
            staff_id: 'staff-1',
            house_id: 'house-1',
            shift_date: '2026-03-23', 
            start_time: '09:00',
            end_time: '17:00',
            staff: { id: 'staff-1', name: 'John Doe' },
            assigned_checklists: [
              {
                checklist_id: 'cl-1',
                assignment_title: 'Morning Handover',
                submissions: []
              }
            ]
          },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseCalendarEvents('house-1'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should have 3 events: 1 Meeting, 1 Shift entry, 1 Shift-assigned checklist
    expect(result.current.houseCalendarEvents).toHaveLength(3);
    
    const meeting = result.current.houseCalendarEvents.find(e => e.type === 'meeting');
    const shift = result.current.houseCalendarEvents.find(e => e.type === 'shift');
    const checklist = result.current.houseCalendarEvents.find(e => e.type === 'checklist');

    expect(meeting?.title).toBe('House Meeting');
    expect(shift?.title).toBe('John Doe');
    expect(checklist?.title).toBe('Morning Handover');
  });
});

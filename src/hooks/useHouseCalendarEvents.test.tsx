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
  it('should combine regular events and shifts (excluding shift-assigned checklists)', async () => {
    server.use(
      // 1. Mock regular calendar events with junction table style data
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => {
        return HttpResponse.json([
          { 
            id: 'evt-1', 
            house_id: 'house-1', 
            title: 'House Meeting', 
            event_date: '2026-03-23', 
            status: 'scheduled',
            is_checklist_event: false,
            event_participants: [{ participant: { id: 'p-1', name: 'Alice' } }],
            event_staff: [{ staff: { id: 's-1', name: 'Bob' } }]
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
            start_date: '2026-03-23', 
            start_time: '09:00',
            end_time: '17:00',
            shift_template: 'Morning',
            staff: { id: 'staff-1', name: 'John Doe' },
            assigned_checklists: [
              {
                id: 'ac-1',
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

    // Should have 2 events: 1 Meeting, 1 Shift entry (Shift-assigned checklists are now INTERNAL to the shift)
    expect(result.current.houseCalendarEvents).toHaveLength(2);
    
    const meeting = result.current.houseCalendarEvents.find(e => e.type === 'event');
    const shift = result.current.houseCalendarEvents.find(e => e.type === 'shift');

    expect(meeting?.title).toBe('House Meeting');
    expect(shift?.title).toBe('Morning - John Doe');
    
    // Verify junction data is mapped
    expect(meeting?.event_participants).toHaveLength(1);
    expect(meeting?.event_staff).toHaveLength(1);
  });
});

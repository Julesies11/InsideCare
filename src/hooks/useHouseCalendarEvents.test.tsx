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
  it('should intelligently map event types based on title and checklist flag', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => {
        return HttpResponse.json([
          { 
            id: 'evt-1', 
            title: 'Team Meeting', 
            is_checklist_event: false,
            event_type_info: { name: 'Meeting' }
          },
          { 
            id: 'evt-2', 
            title: 'Doctor Appointment', 
            is_checklist_event: false,
            event_type_info: { name: 'Appointment' }
          },
          { 
            id: 'cl-1', 
            title: 'Evening Checklist', 
            is_checklist_event: true
          },
        ]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([]);
      })
    );

    const { result } = renderHook(() => useHouseCalendarEvents('house-1'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.houseCalendarEvents).toHaveLength(3);
    
    const meeting = result.current.houseCalendarEvents.find(e => e.id === 'evt-1');
    const appointment = result.current.houseCalendarEvents.find(e => e.id === 'evt-2');
    const checklist = result.current.houseCalendarEvents.find(e => e.id === 'cl-1');

    expect(meeting?.type).toBe('meeting');
    expect(appointment?.type).toBe('appointment');
    expect(checklist?.type).toBe('checklist');
  });

  it('should include participants when fetching shifts', async () => {
    const mockParticipants = [
      { participant: { id: 'p1', name: 'John Doe' } },
      { participant: { id: 'p2', name: 'Jane Smith' } }
    ];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_events`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([
          {
            id: 'shift-1',
            start_date: '2026-04-13',
            start_time: '08:00',
            end_time: '16:00',
            staff_id: { id: 's1', name: 'Staff Member' },
            shift_template: 'Morning',
            participants: mockParticipants
          }
        ]);
      })
    );

    const { result } = renderHook(() => useHouseCalendarEvents('house-1'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const shiftEvent = result.current.houseCalendarEvents.find(e => e.id === 'shift-shift-1');
    expect(shiftEvent).toBeDefined();
    expect(shiftEvent?.event_participants).toHaveLength(2);
    expect(shiftEvent?.event_participants?.[0].participant.name).toBe('John Doe');
    expect(shiftEvent?.event_participants?.[1].participant.id).toBe('p2');
  });
});

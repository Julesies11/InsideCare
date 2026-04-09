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
});

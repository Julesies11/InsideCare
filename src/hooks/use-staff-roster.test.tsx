import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStaffRoster, useStaffShiftsPaginated } from './use-staff-roster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { TABLES } from '@/config/db-tables';
import { ReactNode } from 'react';
import { ShiftRow, HouseRow, Row } from '@/test/type-helpers';

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

describe('useStaffRoster hooks', () => {
  const staffId = 'staff-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useStaffRoster', () => {
    it('fetches and merges shifts and events', async () => {
      const mockShifts: (Partial<ShiftRow> & { house: Partial<HouseRow> })[] = [
        {
          id: 'shift-1',
          start_date: '2026-04-10',
          start_time: '10:00:00',
          end_time: '14:00:00',
          shift_template: 'Standard',
          house: { house_name: 'House A' }
        }
      ];

      const mockEvents: (Partial<Row<'ic_house_calendar_events'>> & { 
        type: { event_type_name: string, color: string }, 
        house: Partial<HouseRow>,
        staff_assignments: any[] 
      })[] = [
        {
          id: 'event-1',
          title: 'Meeting',
          event_date: '2026-04-10',
          start_time: '09:00:00',
          end_time: '09:30:00',
          location: 'Office',
          type: { event_type_name: 'Meeting', color: 'blue' },
          house: { house_name: 'House A' },
          staff_assignments: [{ staff_id: staffId }]
        }
      ];

      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, () => HttpResponse.json(mockShifts)),
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_CALENDAR_EVENTS}`, () => HttpResponse.json(mockEvents)),
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => HttpResponse.json([])),
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_REQUESTS}`, () => HttpResponse.json([]))
      );

      const { result } = renderHook(() => useStaffRoster(staffId), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const entries = result.current.data;
      expect(entries).toHaveLength(2);
      
      expect(entries[0].entry_type).toBe('shift');
      expect(entries[1].entry_type).toBe('event');
    });
  });

  describe('useStaffShiftsPaginated', () => {
    it('fetches paginated shifts', async () => {
      const mockData = [
        {
          id: 'shift-1',
          start_date: '2026-04-10',
          start_time: '10:00:00',
          end_time: '14:00:00',
          shift_template: 'Standard',
          house: { house_name: 'House A' }
        }
      ];

      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, () => {
          return HttpResponse.json(mockData, {
            headers: {
              'content-range': '0-0/1'
            }
          });
        }),
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => HttpResponse.json([])),
        http.get(`${SUPABASE_URL}/rest/v1/${TABLES.SHIFT_NOTES}`, () => HttpResponse.json([]))
      );

      const { result } = renderHook(() => useStaffShiftsPaginated({ staffId, pageIndex: 0, pageSize: 50 }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.count).toBe(1);
      expect(result.current.data?.data[0].id).toBe('shift-1');
    });
  });
});

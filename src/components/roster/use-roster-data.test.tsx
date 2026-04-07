import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useShiftsQuery, useRosterData } from './use-roster-data';
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

// Mock calculateDuration since it's an implementation detail
vi.mock('./roster-utils', async () => {
  const actual = await vi.importActual('./roster-utils') as any;
  return {
    ...actual,
    calculateDuration: vi.fn(() => 8),
  };
});

describe('Roster Query Hooks', () => {
  describe('useShiftsQuery', () => {
    it('should fetch and map shifts with frontend joining', async () => {
      // Mock Houses and Staff for Frontend Joining
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
          return HttpResponse.json([
            { id: 'house-1', name: 'Alpha House', status: 'active' }
          ]);
        }),
        http.get(`${SUPABASE_URL}/rest/v1/staff`, () => {
          return HttpResponse.json([
            { id: 'staff-1', name: 'John Caregiver', status: 'active' }
          ]);
        }),
        http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
          return HttpResponse.json([
            {
              id: 'shift-1',
              staff_id: 'staff-1',
              start_date: '2026-04-01',
              end_date: '2026-04-01',
              start_time: '09:00:00',
              end_time: '17:00:00',
              house_id: 'house-1',
              shift_template: 'SIL',
              notes: 'Test note',
              type_details: { color_theme: 'blue', icon_name: 'home' },
              participants: [],
              assigned_checklists: [],
              notes_count: [{ count: 2 }]
            }
          ]);
        })
      );

      const { result } = renderHook(() => useShiftsQuery('all', '2026-04-01', '2026-04-07'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.shifts).toHaveLength(1);
      const shift = result.current.shifts[0];
      
      // Verify Frontend Joining worked
      expect(shift.house?.name).toBe('Alpha House');
      expect(shift.staff_name).toBe('John Caregiver');
      
      // Verify Mapping
      expect(shift.color_theme).toBe('blue');
      expect(shift.notesCount).toBe(2);
    });
  });

  describe('useRosterData', () => {
    it('should provide metadata from TanStack Query', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
          return HttpResponse.json([{ id: 'h1', name: 'House 1', status: 'active' }]);
        }),
        http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
          return HttpResponse.json([{ id: 'p1', name: 'Part 1', status: 'active' }]);
        }),
        http.get(`${SUPABASE_URL}/rest/v1/staff`, () => {
          return HttpResponse.json([{ id: 's1', name: 'Staff 1', status: 'active' }]);
        })
      );

      const { result } = renderHook(() => useRosterData(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.houses).toHaveLength(1);
      expect(result.current.houses[0].name).toBe('House 1');
      expect(result.current.participants).toHaveLength(1);
      expect(result.current.staff).toHaveLength(1);
    });
  });
});

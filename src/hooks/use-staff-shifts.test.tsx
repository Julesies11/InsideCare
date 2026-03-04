import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStaffShifts } from './use-staff-shifts';
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

describe('useStaffShifts', () => {
  it('should fetch shifts and participants successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([
          {
            id: 'shift-1',
            staff_id: 'staff-1',
            shift_date: '2026-03-04',
            start_time: '09:00',
            end_time: '17:00',
            house_id: 'house-1',
            shift_type: 'day',
            status: 'confirmed',
            house: { id: 'house-1', name: 'Test House 1' }
          },
        ]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/shift_participants`, () => {
        return HttpResponse.json([
          {
            shift_id: 'shift-1',
            participant: { id: 'participant-1', name: 'John Doe' }
          },
        ]);
      })
    );

    const { result } = renderHook(() => useStaffShifts('staff-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].duration_hours).toBe(8);
    expect(result.current.data?.[0].participants).toHaveLength(1);
    expect(result.current.data?.[0].participants?.[0].name).toBe('John Doe');
  });
});

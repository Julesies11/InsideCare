import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouses } from '@/hooks/use-houses';
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

describe('useHouses Active Staff Count', () => {
  it('should calculate active staff count correctly based on status and dates', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json([
          {
            id: 'house-1',
            name: 'Test House 1',
            status: 'active',
            staff_assignments: [
              // 1. Active staff, no end date -> COUNT
              { id: 'a1', end_date: null, staff: { status: 'active' } },
              // 2. Inactive staff -> SKIP
              { id: 'a2', end_date: null, staff: { status: 'inactive' } },
              // 3. Active staff, future end date -> COUNT
              { id: 'a3', end_date: tomorrow, staff: { status: 'active' } },
              // 4. Active staff, past end date -> SKIP
              { id: 'a4', end_date: yesterday, staff: { status: 'active' } },
            ]
          }
        ]);
      })
    );

    const { result } = renderHook(() => useHouses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const house = result.current.houses[0];
    // Expected count is 2 (assignments 1 and 3)
    const staffCount = (house as any).staff_assignments[0].count;
    expect(staffCount).toBe(2);
  });
});

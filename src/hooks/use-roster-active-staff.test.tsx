import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRosterData } from '@/components/roster/use-roster-data';
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

describe('useRosterData Active Staff Filtering', () => {
  it('should only include active house assignments in the staff metadata', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json([{ id: 'h1', name: 'House 1', status: 'active' }]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff`, () => {
        return HttpResponse.json([
          {
            id: 's1',
            name: 'Staff One',
            status: 'active',
            house_assignments: [
              // 1. Active assignment -> KEEP
              { id: 'ha1', house_id: 'h1', end_date: null, house: [{ id: 'h1', name: 'House 1' }] },
              // 2. Expired assignment -> SKIP
              { id: 'ha2', house_id: 'h1', end_date: yesterday, house: [{ id: 'h1', name: 'House 1' }] },
              // 3. Future assignment -> KEEP
              { id: 'ha3', house_id: 'h1', end_date: tomorrow, house: [{ id: 'h1', name: 'House 1' }] },
            ]
          }
        ]);
      })
    );

    const { result } = renderHook(() => useRosterData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const staffMember = result.current.staff[0];
    expect(staffMember.house_assignments).toHaveLength(2);
    expect(staffMember.house_assignments[0].id).toBe('ha1');
    expect(staffMember.house_assignments[1].id).toBe('ha3');
  });
});

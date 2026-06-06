import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseStaffAssignments } from './use-house-staff-assignments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { TABLES } from '@/config/db-tables';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useHouseStaffAssignments', () => {
  it('fetches house staff assignments when houseId is provided', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_STAFF_ASSIGNMENTS}`, () => {
        return HttpResponse.json([
          {
            id: 'hsa-1',
            house_id: 'house-1',
            staff_id: 'staff-1',
            is_primary: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            staff: { id: 'staff-1', staff_name: 'John Staff' }
          },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseStaffAssignments('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].staff?.staff_name).toBe('John Staff');
    expect(result.current.assignments).toHaveLength(1);
  });

  it('does NOT fetch when houseId is undefined (default enabled guard)', () => {
    const fetchSpy = vi.fn(() => HttpResponse.json([]));
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_STAFF_ASSIGNMENTS}`, fetchSpy)
    );

    const { result } = renderHook(() => useHouseStaffAssignments(undefined), { wrapper });

    // Query should be disabled — still in idle/pending state, not fetching
    expect(result.current.isFetching).toBe(false);
    expect(result.current.assignments).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does NOT fetch when options.enabled is false, even with a valid houseId', () => {
    const fetchSpy = vi.fn(() => HttpResponse.json([]));
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_STAFF_ASSIGNMENTS}`, fetchSpy)
    );

    const { result } = renderHook(
      () => useHouseStaffAssignments('house-1', { enabled: false }),
      { wrapper }
    );

    expect(result.current.isFetching).toBe(false);
    expect(result.current.assignments).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches when options.enabled is explicitly true with a valid houseId', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_STAFF_ASSIGNMENTS}`, () => {
        return HttpResponse.json([
          {
            id: 'hsa-2',
            house_id: 'house-2',
            staff_id: 'staff-2',
            is_primary: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ]);
      })
    );

    const { result } = renderHook(
      () => useHouseStaffAssignments('house-2', { enabled: true }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.assignments).toHaveLength(1);
  });

  it('returns empty assignments array when no data exists', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_STAFF_ASSIGNMENTS}`, () =>
        HttpResponse.json([])
      )
    );

    const { result } = renderHook(() => useHouseStaffAssignments('house-empty'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.assignments).toEqual([]);
  });

  it('exposes loading state correctly during fetch', () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_STAFF_ASSIGNMENTS}`, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return HttpResponse.json([]);
      })
    );

    const { result } = renderHook(() => useHouseStaffAssignments('house-loading'), { wrapper });

    // Initial state should be loading since houseId is present
    expect(result.current.loading).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseShiftTypes } from './use-house-shift-types';
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

describe('useHouseShiftTypes', () => {
  it('should fetch shift types for a house', async () => {
    const mockShiftTypes = [
      { id: 'st-1', house_id: 'house-1', name: 'Morning', short_name: 'M', sort_order: 10, is_active: true },
      { id: 'st-2', house_id: 'house-1', name: 'Afternoon', short_name: 'A', sort_order: 20, is_active: true }
    ];

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_shift_types`, () => {
        return HttpResponse.json(mockShiftTypes);
      })
    );

    const { result } = renderHook(() => useHouseShiftTypes('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.shiftTypes).toHaveLength(2);
    expect(result.current.shiftTypes[0].name).toBe('Morning');
  });

  it('should create a new shift type', async () => {
    const newType = { name: 'Night', short_name: 'N' };
    
    server.use(
      http.post(`${SUPABASE_URL}/rest/v1/house_shift_types`, () => {
        return HttpResponse.json({ id: 'st-3', ...newType, house_id: 'house-1' });
      })
    );

    const { result } = renderHook(() => useHouseShiftTypes('house-1'), { wrapper });

    result.current.createShiftType.mutate(newType);
    
    await waitFor(() => expect(result.current.createShiftType.isSuccess).toBe(true));
  });
});

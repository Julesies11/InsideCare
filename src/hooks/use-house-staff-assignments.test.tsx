import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseStaffAssignments } from './use-house-staff-assignments';
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

describe('useHouseStaffAssignments', () => {
  it('should fetch house staff assignments successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_staff_assignments`, () => {
        return HttpResponse.json([
          { 
            id: 'hsa-1', 
            house_id: 'house-1', 
            staff_id: 'staff-1', 
            is_primary: true,
            staff: { id: 'staff-1', name: 'John Staff' }
          },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseStaffAssignments('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].staff?.name).toBe('John Staff');
  });
});

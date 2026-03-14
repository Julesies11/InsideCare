import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseTypesMaster } from './use-house-types-master';
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

describe('useHouseTypesMaster', () => {
  it('should fetch house types successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_types_master`, () => {
        return HttpResponse.json([
          { id: 'ht-1', name: 'SIL', status: 'Active' },
          { id: 'ht-2', name: 'SDA', status: 'Active' },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseTypesMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('SIL');
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseChecklists } from './use-house-checklists';
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

describe('useHouseChecklists', () => {
  it('should fetch house checklists successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_checklists`, () => {
        return HttpResponse.json([
          { id: 'cl-1', house_id: 'house-1', name: 'Morning Routine', frequency: 'daily', items: [] },
        ]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/house_checklist_submissions`, () => {
        return HttpResponse.json([]);
      })
    );

    const { result } = renderHook(() => useHouseChecklists('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Morning Routine');
  });
});

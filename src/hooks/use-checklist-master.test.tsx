import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChecklistMaster } from './use-checklist-master';
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

describe('useChecklistMaster', () => {
  it('should fetch checklist master records successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/checklist_master`, () => {
        return HttpResponse.json([
          { id: 'cm-1', name: 'Morning Routine', frequency: 'daily' },
        ]);
      })
    );

    const { result } = renderHook(() => useChecklistMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Morning Routine');
  });
});

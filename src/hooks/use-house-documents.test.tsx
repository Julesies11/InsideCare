import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseDocuments } from './use-house-documents';
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

describe('useHouseDocuments', () => {
  it('should fetch house documents successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_files`, () => {
        return HttpResponse.json([
          { id: 'doc-1', house_id: 'house-1', file_name: 'safety-plan.pdf', status: 'current' },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseDocuments('house-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].file_name).toBe('safety-plan.pdf');
  });
});

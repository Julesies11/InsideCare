import { ReactElement, ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { useStaffDocuments } from './use-staff-documents';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () =>
  new QueryClient({
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

describe('useStaffDocuments', () => {
  it('should fetch staff documents successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_DOCUMENTS}`, () => {
        return HttpResponse.json([
          {
            id: 'doc-1',
            staff_id: 'staff-1',
            file_name: 'resume.pdf',
            file_path: 'staff-1/resume.pdf',
          },
        ]);
      }),
    );

    const { result } = renderHook(() => useStaffDocuments('staff-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].file_name).toBe('resume.pdf');
  });
});

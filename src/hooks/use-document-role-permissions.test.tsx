import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  useDocumentRolePermissions,
  useUpdateDocumentRolePermissions,
} from './use-document-role-permissions';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: [
              {
                id: '1',
                document_id: 'doc-1',
                role_id: 'role-1',
                access_level: 'read_only',
                role: { role_name: 'Staff' },
              },
            ],
            error: null,
          }),
        ),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDocumentRolePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches document role permissions', async () => {
    const { result } = renderHook(() => useDocumentRolePermissions('doc-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].role_id).toBe('role-1');
    expect(supabase.from).toHaveBeenCalledWith('ic_participant_document_roles');
  });

  it('updates document role permissions', async () => {
    const { result } = renderHook(() => useUpdateDocumentRolePermissions(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      documentId: 'doc-1',
      roles: [{ role_id: 'role-2', access_level: 'read_only' }],
    });

    expect(supabase.from).toHaveBeenCalledWith('ic_participant_document_roles');
  });
});

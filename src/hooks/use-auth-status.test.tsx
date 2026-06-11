import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { useRBAC } from '@/hooks/useRBAC';
import { useAdminAuthStatus } from './use-auth-status';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: vi.fn(),
  ACCESS_LEVEL: {
    FULL: 'full',
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAdminAuthStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should not fetch data if user is not an admin', async () => {
    (useRBAC as any).mockReturnValue({
      hasAccess: vi.fn().mockReturnValue(false),
    });

    const { result } = renderHook(() => useAdminAuthStatus(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('should fetch auth status data if user is an admin', async () => {
    (useRBAC as any).mockReturnValue({
      hasAccess: vi.fn().mockReturnValue(true),
    });

    const mockData = {
      'user-1': {
        id: 'user-1',
        email: 'test@example.com',
        created_at: '2026-05-25T10:00:00Z',
        confirmed_at: '2026-05-25T11:00:00Z',
        last_sign_in_at: '2026-05-25T12:00:00Z',
        invited_at: '2026-05-25T09:00:00Z',
      },
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => useAdminAuthStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'ic-admin-auth-status',
    );
  });

  it('should handle errors from the edge function', async () => {
    (useRBAC as any).mockReturnValue({
      hasAccess: vi.fn().mockReturnValue(true),
    });

    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: new Error('Edge function error'),
    });

    const { result } = renderHook(() => useAdminAuthStatus(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

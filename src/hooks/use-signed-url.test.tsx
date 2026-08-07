import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { useSignedUrl } from './use-signed-url';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockStorageFrom = vi.fn();
  return {
    supabase: {
      storage: {
        from: mockStorageFrom,
      },
    },
  };
});

describe('useSignedUrl Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });

    // Default mock implementation for each test
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrl: vi.fn((path) =>
        Promise.resolve({
          data: { signedUrl: `https://signed-url.com/${path}` },
          error: null,
        }),
      ),
      createSignedUrls: vi.fn((paths) =>
        Promise.resolve({
          data: paths.map((p) => ({
            path: p,
            signedUrl: `https://signed-url.com/${p}`,
            error: null,
          })),
          error: null,
        }),
      ),
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return null if no path is provided', async () => {
    const { result } = renderHook(() => useSignedUrl('test-bucket', null), {
      wrapper,
    });

    // It defaults to null and enabled: !!path means it won't fetch
    expect(result.current.url).toBeNull();
    // Verify loading is strictly false when path is null to avoid infinite spinners
    expect(result.current.loading).toBe(false);
  });

  it('should return the path immediately if it is a full HTTP URL', async () => {
    const fullUrl = 'https://external-storage.com/photo.jpg';
    const { result } = renderHook(() => useSignedUrl('test-bucket', fullUrl), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.url).toBe(fullUrl);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fetch a signed URL for a naked path', async () => {
    const { result } = renderHook(
      () => useSignedUrl('staff-photos', 'staff-1/avatar.jpg'),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.url).toBe(
          'https://signed-url.com/staff-1/avatar.jpg',
        );
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(supabase.storage.from).toHaveBeenCalledWith('staff-photos');
  });

  it('should handle errors gracefully', async () => {
    // Override for THIS test only
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrls: vi.fn(() =>
        Promise.resolve({ data: null, error: new Error('Storage error') }),
      ),
    } as any);

    const { result } = renderHook(
      () => useSignedUrl('staff-photos', 'error-path.jpg'),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeDefined();
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(result.current.url).toBeNull();
  });

  it('should cap negative staleTime mathematically if expiresIn is too small', async () => {
    // This will now use the DEFAULT mock defined in beforeEach
    const { result } = renderHook(
      () => useSignedUrl('staff-photos', 'staff-1/avatar.jpg', 30),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.url).toBe(
          'https://signed-url.com/staff-1/avatar.jpg',
        );
      },
      { timeout: 2000 },
    );

    const mockFrom = vi.mocked(supabase.storage.from);
    const mockCreateSignedUrls =
      mockFrom.mock.results[0].value.createSignedUrls;
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(
      ['staff-1/avatar.jpg'],
      30,
    );
  });
});

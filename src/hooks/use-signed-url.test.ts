import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSignedUrl } from './use-signed-url';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://signed-url.com/photo.jpg' }, error: null })),
      })),
    },
  },
}));

describe('useSignedUrl Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if no path is provided', () => {
    const { result } = renderHook(() => useSignedUrl('test-bucket', null));
    expect(result.current.url).toBeNull();
  });

  it('should return the path immediately if it is a full HTTP URL', async () => {
    const fullUrl = 'https://external-storage.com/photo.jpg';
    const { result } = renderHook(() => useSignedUrl('test-bucket', fullUrl));
    expect(result.current.url).toBe(fullUrl);
  });

  it('should fetch a signed URL for a naked path', async () => {
    const { result } = renderHook(() => useSignedUrl('staff-photos', 'staff-1/avatar.jpg'));
    
    await waitFor(() => expect(result.current.url).toBe('https://signed-url.com/photo.jpg'));
    
    expect(supabase.storage.from).toHaveBeenCalledWith('staff-photos');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(supabase.storage.from).mockReturnValueOnce({
      createSignedUrl: vi.fn(() => Promise.resolve({ data: null, error: new Error('Storage error') })),
    } as any);

    const { result } = renderHook(() => useSignedUrl('staff-photos', 'error-path.jpg'));
    
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.url).toBeNull();
  });
});

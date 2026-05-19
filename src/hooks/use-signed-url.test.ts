import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSignedUrl, getSignedUrl } from './use-signed-url';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn((path) => 
          Promise.resolve({ data: { signedUrl: `http://signed.com/${path}` }, error: null })
        ),
      })),
    },
  },
}));

describe('useSignedUrl Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null if no path is provided', () => {
    const { result } = renderHook(() => useSignedUrl('bucket', null));
    expect(result.current.url).toBeNull();
  });

  it('resolves a simple path to a signed URL', async () => {
    const { result } = renderHook(() => useSignedUrl('test-bucket', 'folder/file.jpg'));
    
    await waitFor(() => expect(result.current.url).toBe('http://signed.com/folder/file.jpg'));
    expect(supabase.storage.from).toHaveBeenCalledWith('test-bucket');
  });

  it('handles legacy public URLs by extracting the path', async () => {
    const legacyUrl = 'https://abc.supabase.co/storage/v1/object/public/my-bucket/old/path.png';
    const { result } = renderHook(() => useSignedUrl('any', legacyUrl));

    await waitFor(() => expect(result.current.url).toBe('http://signed.com/old/path.png'));
    expect(supabase.storage.from).toHaveBeenCalledWith('my-bucket');
  });

  it('detects the participants bucket for paths starting with participant-photos/', async () => {
    const nakedPath = 'participant-photos/uuid-123.jpg';
    const { result } = renderHook(() => useSignedUrl('default-bucket', nakedPath));

    await waitFor(() => expect(result.current.url).toBe('http://signed.com/participant-photos/uuid-123.jpg'));
    expect(supabase.storage.from).toHaveBeenCalledWith('participants');
  });

  it('returns non-supabase external URLs as-is', async () => {
    const externalUrl = 'https://google.com/image.jpg';
    const { result } = renderHook(() => useSignedUrl('any', externalUrl));

    await waitFor(() => expect(result.current.url).toBe(externalUrl));
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });
});

describe('getSignedUrl Utility', () => {
  it('resolves a path asynchronously', async () => {
    const url = await getSignedUrl('bucket', 'path.jpg');
    expect(url).toBe('http://signed.com/path.jpg');
  });

  it('handles legacy URLs asynchronously', async () => {
    const legacyUrl = 'https://abc.supabase.co/storage/v1/object/public/b/p.png';
    const url = await getSignedUrl('any', legacyUrl);
    expect(url).toBe('http://signed.com/p.png');
  });
});

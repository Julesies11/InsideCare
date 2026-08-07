import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignedUrlBatcher } from './signed-url-batcher';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      createSignedUrls: vi.fn().mockImplementation((paths) => {
        return Promise.resolve({
          data: paths.map((path: string) => ({
            path,
            signedUrl: `https://example.com/${path}?token=abc`,
          })),
          error: null,
        });
      }),
    },
  },
}));

describe('SignedUrlBatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Accessing private member for testing purposes
    (SignedUrlBatcher as any).queue.clear();
    if ((SignedUrlBatcher as any).timeouts.size > 0) {
      (SignedUrlBatcher as any).timeouts.forEach((t: any) => clearTimeout(t));
      (SignedUrlBatcher as any).timeouts.clear();
    }
  });

  it('should batch multiple requests into a single call', async () => {
    const p1 = SignedUrlBatcher.get('bucket1', 'path1');
    const p2 = SignedUrlBatcher.get('bucket1', 'path2');

    const [url1, url2] = await Promise.all([p1, p2]);

    expect(url1).toBe('https://example.com/path1?token=abc');
    expect(url2).toBe('https://example.com/path2?token=abc');

    expect(supabase.storage.from).toHaveBeenCalledWith('bucket1');
    expect((supabase.storage as any).createSignedUrls).toHaveBeenCalledTimes(1);
    expect((supabase.storage as any).createSignedUrls).toHaveBeenCalledWith(
      ['path1', 'path2'],
      3600,
    );
  });

  it('should chunk requests when exceeding CHUNK_SIZE (50)', async () => {
    const paths = Array.from({ length: 75 }, (_, i) => `path${i}`);
    const promises = paths.map((p) => SignedUrlBatcher.get('bucket1', p));

    const results = await Promise.all(promises);

    expect(results).toHaveLength(75);
    expect(results[0]).toBe('https://example.com/path0?token=abc');
    expect(results[74]).toBe('https://example.com/path74?token=abc');

    expect((supabase.storage as any).createSignedUrls).toHaveBeenCalledTimes(2);
    // First chunk should be 50, second should be 25
    expect(
      vi.mocked((supabase.storage as any).createSignedUrls).mock.calls[0][0],
    ).toHaveLength(50);
    expect(
      vi.mocked((supabase.storage as any).createSignedUrls).mock.calls[1][0],
    ).toHaveLength(25);
  }, 10000);

  it('should handle duplicate paths in the same batch', async () => {
    const p1 = SignedUrlBatcher.get('bucket1', 'path1');
    const p2 = SignedUrlBatcher.get('bucket1', 'path1'); // Duplicate

    const [url1, url2] = await Promise.all([p1, p2]);

    expect(url1).toBe(url2);
    expect((supabase.storage as any).createSignedUrls).toHaveBeenCalledWith(
      ['path1'],
      3600,
    );
  });

  it('should handle errors in a single chunk gracefully', async () => {
    // Mock failure for the first chunk only
    vi.mocked((supabase.storage as any).createSignedUrls).mockResolvedValueOnce({
      data: null,
      error: { message: 'Chunk 1 failed' } as any,
    });

    const paths = Array.from({ length: 75 }, (_, i) => `path${i}`);
    const promises = paths.map((p) => SignedUrlBatcher.get('bucket1', p));

    const results = await Promise.all(promises);

    // First 50 should be null (failed), remaining 25 should be resolved
    expect(results.slice(0, 50).every((r) => r === null)).toBe(true);
    expect(results.slice(50).every((r) => r !== null)).toBe(true);
  });
});

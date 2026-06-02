import { useQuery } from '@tanstack/react-query';
import { SignedUrlBatcher } from '@/lib/signed-url-batcher';
import { QUERY_KEYS } from '@/config/query-keys';

/**
 * Hook to get a signed URL for a private storage object.
 * Caches the URL using TanStack Query to prevent duplicate requests
 * for the same image across the application.
 */
export function useSignedUrl(bucket: string, path: string | null | undefined, expiresIn: number = 3600) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.SIGNED_URL, bucket, path, expiresIn],
    queryFn: async () => {
      if (!path) return null;

      // 1. Handle Full HTTP URLs or DataURLs
      if (path.startsWith('http') || path.startsWith('data:')) {
        // If it's a supabase public URL, try to sign it anyway in case bucket is now private
        if (path.startsWith('http') && path.includes('.supabase.co/storage/v1/object/public/')) {
          const parts = path.split('/public/')[1].split('/');
          const extractedBucket = parts[0];
          const extractedPath = parts.slice(1).join('/');

          return await SignedUrlBatcher.get(extractedBucket, extractedPath, expiresIn);
        }
        return path;
      }

      // 2. Handle Naked Paths
      return await SignedUrlBatcher.get(bucket, path, expiresIn);
    },
    // Cache the URL for slightly less than the expiration time, ensuring it doesn't drop below 0
    staleTime: Math.max(0, (expiresIn - 60) * 1000), 
    enabled: !!path,
  });

  return { 
    url: query.data || null, 
    loading: !!path && query.isLoading, 
    error: query.error as Error | null 
  };
}

/**
 * Utility to get a signed URL in an async context (e.g. event handlers)
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  if (!path) return null;

  // Handle Full HTTP URLs or DataURLs
  if (path.startsWith('http') || path.startsWith('data:')) {
    if (path.startsWith('http') && path.includes('.supabase.co/storage/v1/object/public/')) {
      const parts = path.split('/public/')[1].split('/');
      const b = parts[0];
      const p = parts.slice(1).join('/');
      return await SignedUrlBatcher.get(b, p, expiresIn);
    }
    return path;
  }

  // Handle Naked Paths
  try {
    return await SignedUrlBatcher.get(bucket, path, expiresIn);
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

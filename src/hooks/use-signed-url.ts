import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to get a signed URL for a private storage object.
 * Caches the URL for the duration of the hook's lifecycle.
 */
export function useSignedUrl(bucket: string, path: string | null | undefined, expiresIn: number = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    // 1. Handle Full HTTP URLs (e.g. legacy public URLs)
    if (path.startsWith('http')) {
      // If it's a supabase public URL, try to sign it anyway in case bucket is now private
      if (path.includes('.supabase.co/storage/v1/object/public/')) {
        const parts = path.split('/public/')[1].split('/');
        const extractedBucket = parts[0];
        const extractedPath = parts.slice(1).join('/');
        fetchSignedUrl(extractedBucket, extractedPath);
        return;
      }
      setUrl(path);
      return;
    }

    // 2. Handle Naked Paths - No more legacy redirection
    fetchSignedUrl(bucket, path);
  }, [bucket, path]);

  async function fetchSignedUrl(b: string, p: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from(b).createSignedUrl(p, expiresIn);
      if (error) throw error;
      setUrl(data.signedUrl);
    } catch (err) {
      console.error('Error creating signed URL:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { url, loading, error };
}

/**
 * Utility to get a signed URL in an async context (e.g. event handlers)
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  if (!path) return null;
  
  // Handle Full HTTP URLs
  if (path.startsWith('http')) {
    if (path.includes('.supabase.co/storage/v1/object/public/')) {
      const parts = path.split('/public/')[1].split('/');
      const b = parts[0];
      const p = parts.slice(1).join('/');
      const { data, error } = await supabase.storage.from(b).createSignedUrl(p, expiresIn);
      if (error) return null;
      return data.signedUrl;
    }
    return path;
  }

  // Handle Naked Paths
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

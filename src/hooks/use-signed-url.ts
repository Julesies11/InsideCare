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

    // 1. Handle Legacy Public URLs
    if (path.startsWith('http')) {
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

    // 2. Handle Naked Paths
    let targetBucket = bucket;
    const targetPath = path;

    // Detection logic for legacy paths that might be in different buckets
    if (path.startsWith('participant-photos/')) {
      // If the provided bucket is participant-documents but path looks legacy, 
      // check the participants bucket instead.
      targetBucket = 'participants';
    } else if (path.startsWith('staff-photos/')) {
      targetBucket = 'staff-documents';
    }

    fetchSignedUrl(targetBucket, targetPath);
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
  
  // 1. Handle Legacy Public URLs
  let b = bucket;
  let p = path;
  
  if (path.startsWith('http') && path.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = path.split('/public/')[1].split('/');
    b = parts[0];
    p = parts.slice(1).join('/');
  } else if (path.startsWith('http')) {
    return path;
  }

  // 2. Handle Naked Paths with Legacy Prefixes
  if (path.startsWith('participant-photos/')) {
    b = 'participants';
  } else if (path.startsWith('staff-photos/')) {
    b = 'staff-documents';
  }

  const { data, error } = await supabase.storage.from(b).createSignedUrl(p, expiresIn);
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

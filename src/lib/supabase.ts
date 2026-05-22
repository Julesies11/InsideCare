import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/models/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Custom fetch wrapper to log Supabase payload sizes in development.
 */
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const response = await fetch(url, options);
  
  if (import.meta.env.DEV) {
    // Clone response to avoid consuming the body stream
    const clonedResponse = response.clone();
    
    clonedResponse.blob().then(blob => {
      const sizeInKB = (blob.size / 1024).toFixed(2);
      const urlStr = url.toString();
      
      // Filter out non-Supabase/PostgREST calls if necessary, 
      // but here we log everything the Supabase client fetches.
      if (urlStr.includes('/rest/v1/') || urlStr.includes('/auth/v1/')) {
        const method = options?.method || 'GET';
        const color = blob.size > 1024 * 100 ? 'color: #ff4d4f; font-weight: bold' : 'color: #52c41a'; // Red if > 100KB
        
        console.groupCollapsed(`%c[Supabase] ${method} ${sizeInKB} KB - ${urlStr.split('?')[0]}`, color);
        console.log('Full URL:', urlStr);
        console.log('Size:', sizeInKB, 'KB');
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        console.groupEnd();
      }
    }).catch(err => console.error('[Supabase Logger Error]', err));
  }
  
  return response;
};

/**
 * Creates and exports a Supabase client instance configured with
 * @supabase/ssr for robust session management and payload size logging.
 */
export const supabase: SupabaseClient<Database> = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      fetch: customFetch
    }
  }
);

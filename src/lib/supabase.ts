import { Database } from '@/models/database.types';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Check your .env file.');
}

/**
 * Custom fetch wrapper to log Supabase payload sizes in development.
 */
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  if (!supabaseUrl) {
    return new Response(JSON.stringify({ error: 'Supabase URL missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const response = await fetch(url, options);

  if (import.meta.env.DEV) {
    // Clone response to avoid consuming the body stream
    const clonedResponse = response.clone();

    clonedResponse
      .blob()
      .then((blob) => {
        const sizeInKB = (blob.size / 1024).toFixed(2);
        const urlStr = url.toString();

        // Filter out non-Supabase/PostgREST calls if necessary,
        // but here we log everything the Supabase client fetches.
        if (urlStr.includes('/rest/v1/') || urlStr.includes('/auth/v1/')) {
          const method = options?.method || 'GET';
          const color =
            blob.size > 1024 * 100
              ? 'color: #ff4d4f; font-weight: bold'
              : 'color: #52c41a'; // Red if > 100KB

          console.groupCollapsed(
            `%c[Supabase] ${method} ${sizeInKB} KB - ${urlStr.split('?')[0]}`,
            color,
          );
          console.log('Full URL:', urlStr);
          console.log('Size:', sizeInKB, 'KB');
          console.log(
            'Headers:',
            Object.fromEntries(response.headers.entries()),
          );
          console.groupEnd();
        }
      })
      .catch((err) => console.error('[Supabase Logger Error]', err));
  }

  return response;
};

/**
 * Creates and exports a Supabase client instance configured with
 * cookie persistence via @supabase/ssr for robust session management.
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    global: {
      fetch: customFetch,
    },
  },
);

// Expose to window for testing
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

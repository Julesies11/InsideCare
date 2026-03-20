import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Creates and exports a Supabase client instance configured with
 * @supabase/ssr for robust session management.
 */
export const supabase: SupabaseClient = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.PLAYWRIGHT_STAFF_EMAIL;
const password = process.env.PLAYWRIGHT_STAFF_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("STAFF LOGIN FAILED:", error.message);
  } else {
    console.log("STAFF LOGIN SUCCESS:", data.user.id);
  }
}
run();

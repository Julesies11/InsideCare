import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectUser() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'julian.gibbings+admin@gmail.com',
    password: 'Password123!',
  });

  if (error) {
    console.error('Login failed:', error.message);
    return;
  }

  const user = data.user;
  console.log('User ID:', user.id);
  console.log('App Metadata:', JSON.stringify(user.app_metadata, null, 2));
  console.log('User Metadata:', JSON.stringify(user.user_metadata, null, 2));
}

inspectUser();

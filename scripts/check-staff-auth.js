import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuth() {
  const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
  const staffEmail = process.env.PLAYWRIGHT_STAFF_EMAIL;
  const staffPassword = process.env.PLAYWRIGHT_STAFF_PASSWORD;
  
  if (adminEmail && adminPassword) {
    console.log(`Checking Admin: ${adminEmail}`);
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error) console.error('❌ Admin login failed:', error.message);
    else console.log('✅ Admin login successful!');
  }

  if (staffEmail && staffPassword) {
    console.log(`Checking Staff: ${staffEmail}`);
    const { error } = await supabase.auth.signInWithPassword({ email: staffEmail, password: staffPassword });
    if (error) console.error('❌ Staff login failed:', error.message);
    else console.log('✅ Staff login successful!');
  }
}
checkAuth();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
  
  console.log(`Logging in as Admin: ${adminEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
    email: adminEmail, 
    password: adminPassword 
  });

  if (authError) {
    console.error('❌ Admin login failed:', authError.message);
    return;
  }
  
  console.log('✅ Admin login successful. Fetching ic_staff...');
  
  const { data: staff, error: staffError } = await supabase
    .from('ic_staff')
    .select('email, status, staff_name, auth_user_id');
    
  if (staffError) {
    console.error('❌ Error fetching staff:', staffError.message);
  } else {
    console.log(`Found ${staff.length} staff members:`);
    staff.forEach(s => console.log(`- ${s.email} (${s.status}) [${s.staff_name}] ID: ${s.auth_user_id}`));
  }
}

inspect();

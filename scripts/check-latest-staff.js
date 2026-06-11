import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStaff() {
  await supabase.auth.signInWithPassword({
    email: 'julian.gibbings+admin@gmail.com',
    password: 'Password123!',
  });

  const { data: staff, error } = await supabase
    .from('ic_staff')
    .select('id, staff_name, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  staff.forEach((s) => console.log(`${s.id}: ${s.staff_name} (${s.status})`));
}

checkStaff();

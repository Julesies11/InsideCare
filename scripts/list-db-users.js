import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
  console.log('--- ic_staff table ---');
  const { data: staff, error: staffError } = await supabase
    .from('ic_staff')
    .select('email, status, staff_name');

  if (staffError) {
    console.error('Error fetching staff:', staffError.message);
  } else {
    staff.forEach((s) =>
      console.log(`- ${s.email} (${s.status}) [${s.staff_name}]`),
    );
  }

  console.log('\n--- ic_houses table ---');
  const { data: houses, error: houseError } = await supabase
    .from('ic_houses')
    .select('house_name, status');

  if (houseError) {
    console.error('Error fetching houses:', houseError.message);
  } else {
    houses.forEach((h) => console.log(`- ${h.house_name} (${h.status})`));
  }
}

listUsers();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function activateStaff() {
  await supabase.auth.signInWithPassword({
    email: 'julian.gibbings+admin@gmail.com',
    password: 'Password123!'
  });

  const { data: latest, error: latestError } = await supabase
    .from('ic_staff')
    .select('id, staff_name, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (latestError) {
    console.error('Latest Error:', latestError.message);
    return;
  }

  console.log(`Attempting to activate: ${latest.staff_name} (${latest.id})`);

  const { data, error } = await supabase
    .from('ic_staff')
    .update({ status: 'active' })
    .eq('id', latest.id)
    .select();

  if (error) {
    console.error('Update Error:', error.message);
  } else {
    console.log('Update Success:', JSON.stringify(data, null, 2));
  }
}

activateStaff();

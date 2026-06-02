import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActivity() {
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

  console.log(`Checking activity for: ${latest.staff_name} (${latest.id})`);

  const { data: log, error } = await supabase
    .from('ic_activity_log')
    .select('*')
    .eq('entity_id', latest.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Log Error:', error.message);
  } else {
    log.forEach(l => console.log(`[${l.created_at}] ${l.action}: ${l.description}`));
  }
}

checkActivity();

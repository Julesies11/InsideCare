/**
 * Migration Script: Sync all existing staff users' RBAC metadata
 * This script iterates through all staff records with an auth_user_id
 * and calls the update-user-permissions Edge Function for each.
 * 
 * Run with: node scripts/sync-all-user-jwt.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env or .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAllUsers() {
  console.log('Starting RBAC metadata synchronization for all staff users...');

  // 1. Fetch all staff with auth_user_id
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, auth_user_id, name')
    .not('auth_user_id', 'is', null);

  if (staffError) {
    console.error('Error fetching staff records:', staffError);
    return;
  }

  console.log(`Found ${staff.length} staff members to sync.`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < staff.length; i++) {
    const member = staff[i];
    try {
      process.stdout.write(`[${i + 1}/${staff.length}] Syncing ${member.name.padEnd(30)} (${member.auth_user_id})... `);
      
      const { data, error } = await supabase.functions.invoke('update-user-permissions', {
        body: { userId: member.auth_user_id },
      });

      if (error) {
        process.stdout.write('FAILED\n');
        console.error(`  => Error: ${error.message || JSON.stringify(error)}`);
        errorCount++;
      } else {
        process.stdout.write('SUCCESS\n');
        successCount++;
      }
    } catch (err) {
      process.stdout.write('ERROR\n');
      console.error(`  => Unexpected error: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\nSynchronization Complete!');
  console.log(`Total processed: ${staff.length}`);
  console.log(`Successfully synced: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

syncAllUsers();

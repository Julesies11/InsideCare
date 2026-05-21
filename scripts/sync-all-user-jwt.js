/**
 * Migration Script: Sync all existing staff users' RBAC metadata
 * This script iterates through all staff records with an auth_user_id
 * and calls the ic-update-user-permissions Edge Function for each.
 * 
 * Run with: node scripts/sync-all-user-jwt.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env or .env.local or .env.dev
dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAllUsers() {
  console.log('Starting RBAC metadata synchronization for all staff users...');

  // 1. Fetch all staff with auth_user_id
  const { data: staff, error: staffError } = await supabase
    .from('ic_staff')
    .select('id, auth_user_id, staff_name')
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
      process.stdout.write(`[${i + 1}/${staff.length}] Syncing ${member.staff_name.padEnd(30)} (${member.auth_user_id})... `);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/ic-update-user-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ userId: member.auth_user_id })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        process.stdout.write('FAILED\n');
        console.error(`  => Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
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

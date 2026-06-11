import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debugging Supabase Authentication Setup\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log(
  '- VITE_SUPABASE_ANON_KEY:',
  supabaseAnonKey ? '✅ Set' : '❌ Missing',
);
console.log(
  '- VITE_SUPABASE_SERVICE_ROLE_KEY:',
  supabaseServiceRoleKey ? '✅ Set' : '❌ Missing',
);
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing required environment variables for basic operation',
  );
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

async function debugAuth() {
  try {
    // Test basic connection
    console.log('🔗 Testing Supabase Connection:');
    const { data, error } = await anonClient
      .from('_healthcheck')
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "table not found" which is expected
      console.log('⚠️  Connection test result:', error.message);
    } else {
      console.log('✅ Supabase connection is working');
    }

    console.log('');

    // Test authentication with demo credentials
    console.log('🔐 Testing Demo User Authentication:');
    const demoEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
    const demoPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

    if (!demoEmail || !demoPassword) {
      console.log(
        '⚠️  PLAYWRIGHT_ADMIN_EMAIL/PASSWORD not set, skipping auth test',
      );
      return;
    }

    const { data: authData, error: authError } =
      await anonClient.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      console.log('');

      if (adminClient) {
        console.log('👥 Checking if demo user exists:');
        const { data: users, error: listError } =
          await adminClient.auth.admin.listUsers();

        if (listError) {
          console.log('❌ Error listing users:', listError.message);
        } else {
          const demoUser = users.users.find((user) => user.email === demoEmail);
          if (demoUser) {
            console.log('✅ Demo user exists in database');
            console.log('🆔 User ID:', demoUser.id);
            console.log(
              '📧 Email confirmed:',
              demoUser.email_confirmed_at ? '✅ Yes' : '❌ No',
            );
          } else {
            console.log('❌ Demo user does not exist');
            console.log('💡 Run: npm run create-demo-user');
          }
        }
      }
    } else {
      console.log('✅ Demo user authentication successful!');
      console.log('🆔 User ID:', authData.user.id);
      console.log('📧 Email:', authData.user.email);

      // Sign out
      await anonClient.auth.signOut();
    }

    console.log('');

    // List all users (if admin client available)
    if (adminClient) {
      console.log('👥 All Users in Database:');
      const { data: allUsers, error: listError } =
        await adminClient.auth.admin.listUsers();

      if (listError) {
        console.log('❌ Error listing users:', listError.message);
      } else {
        if (allUsers.users.length === 0) {
          console.log('📭 No users found in database');
        } else {
          allUsers.users.forEach((user, index) => {
            console.log(
              `${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`,
            );
          });
        }
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the debug
debugAuth();

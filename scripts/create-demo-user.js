import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.dev' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error(
    '- VITE_SUPABASE_SERVICE_ROLE_KEY:',
    supabaseServiceRoleKey ? '✅' : '❌',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setupUsers() {
  console.log('🚀 Provisioning Test Environment (Admin & Staff)...');

  try {
    // 1. Roles & Permissions
    const roles = [
      { name: 'Admin', desc: 'System Administrator', permissions: 'full' },
      {
        name: 'Support Worker',
        desc: 'Care Support Staff',
        permissions: 'read_only',
      },
    ];

    const roleMap = {};

    for (const r of roles) {
      console.log(`Checking for ${r.name} role...`);
      let { data: role, error: roleError } = await supabase
        .from('ic_roles')
        .select('id')
        .eq('role_name', r.name)
        .maybeSingle();

      if (!role) {
        console.log(`Creating ${r.name} role...`);
        const { data: newRole, error: createError } = await supabase
          .from('ic_roles')
          .insert({ role_name: r.name, description: r.desc })
          .select()
          .single();
        if (createError) throw createError;
        role = newRole;

        console.log(`Configuring ${r.name} permissions...`);
        const { error: permError } = await supabase
          .from('ic_role_permissions')
          .update({
            my_roster: 'full',
            my_timesheets: 'full',
            my_leave: 'full',
            shift_routines: 'full',
            participants: r.permissions,
            shift_notes: r.permissions,
            employees: r.permissions,
            timesheets: r.permissions,
            leave_requests: r.permissions,
            houses: r.permissions,
            house_checklists: r.permissions,
            roster_board: r.permissions,
            access_control: r.name === 'Admin' ? 'full' : 'none',
            master_lists: r.permissions,
            activity_log: r.permissions,
          })
          .eq('role_id', role.id);
        if (permError) throw permError;
      }
      roleMap[r.name] = role.id;
    }

    // 2. Users
    const users = [
      {
        email: 'demo@kt.com',
        pass: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'demo123',
        name: 'Demo Admin',
        role: 'Admin',
      },
      {
        email: 'staff@kt.com',
        pass: process.env.PLAYWRIGHT_STAFF_PASSWORD || 'demo123',
        name: 'Demo Staff',
        role: 'Support Worker',
      },
    ];

    for (const u of users) {
      console.log(`Processing user: ${u.email}...`);

      // Auth User
      const {
        data: { users: authUsers },
        error: listError,
      } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      let authUser = authUsers.find((au) => au.email === u.email);

      if (!authUser) {
        console.log(`Creating Auth user ${u.email}...`);
        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email: u.email,
            password: u.pass,
            email_confirm: true,
            user_metadata: { full_name: u.name },
          });
        if (createError) throw createError;
        authUser = newUser.user;
      }

      // Staff Record
      let { data: staff, error: staffError } = await supabase
        .from('ic_staff')
        .select('id')
        .eq('email', u.email)
        .maybeSingle();

      if (!staff) {
        console.log(`Creating ic_staff record for ${u.email}...`);
        const { error: createStaffError } = await supabase
          .from('ic_staff')
          .insert({
            staff_name: u.name,
            email: u.email,
            auth_user_id: authUser.id,
            role_id: roleMap[u.role],
            status: 'active',
          });
        if (createStaffError) throw createStaffError;
      } else {
        console.log(`Updating ic_staff record for ${u.email}...`);
        await supabase
          .from('ic_staff')
          .update({ auth_user_id: authUser.id, role_id: roleMap[u.role] })
          .eq('email', u.email);
      }
    }

    console.log('Checking for default House...');
    let { data: house, error: houseError } = await supabase
      .from('ic_houses')
      .select('id')
      .eq('house_name', 'New House')
      .maybeSingle();

    if (!house) {
      console.log('Creating New House...');
      const { data: newHouse, error: createHouseError } = await supabase
        .from('ic_houses')
        .insert({ house_name: 'New House', status: 'active' })
        .select()
        .single();
      if (createHouseError) throw createHouseError;
      house = newHouse;
    }

    console.log('Checking for default Participant...');
    let { data: participant, error: participantError } = await supabase
      .from('ic_participants')
      .select('id')
      .eq('participant_name', 'John Doe')
      .maybeSingle();

    if (!participant) {
      console.log('Creating John Doe...');
      const { error: createParticipantError } = await supabase
        .from('ic_participants')
        .insert({
          participant_name: 'John Doe',
          email: 'john.doe@example.com',
          status: 'active',
          house_id: house.id,
        });
      if (createParticipantError) throw createParticipantError;
    }

    console.log('Checking for Leave Types...');
    const { data: leaveTypes } = await supabase
      .from('ic_leave_types')
      .select('id')
      .limit(1);
    if (!leaveTypes || leaveTypes.length === 0) {
      console.log('Creating default Leave Types...');
      const { error: ltError } = await supabase.from('ic_leave_types').insert([
        { leave_type_name: 'Annual Leave', is_active: true },
        { leave_type_name: 'Sick Leave', is_active: true },
      ]);
      if (ltError) throw ltError;
    }

    console.log('✅ Environment Provisioned Successfully!');
    console.log('💡 Now run: node scripts/sync-all-user-jwt.js');
  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

setupUsers();

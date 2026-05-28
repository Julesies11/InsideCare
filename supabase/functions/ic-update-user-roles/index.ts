import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Map of role permissions to check against
const PERMISSION_COLUMNS = [
  'my_roster', 'my_timesheets', 'my_leave', 'shift_routines',
  'participants', 'shift_notes', 'employees', 'timesheets',
  'leave_requests', 'roster_board', 'houses', 'house_checklists',
  'access_control', 'master_lists', 'activity_log',
  'reporting_clinical', 'reporting_operational', 'reporting_compliance'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }

    let targetAuthUserId: string | null = null;
    let targetStaffId: string | null = null;

    // 1. Determine the target user from the Webhook Payload
    if (body.table === 'ic_staff') {
      const record = body.type === 'DELETE' ? body.old_record : body.record;
      targetAuthUserId = record.auth_user_id;
      targetStaffId = record.id;
    } else if (body.table === 'ic_house_staff_assignments') {
      const record = body.type === 'DELETE' ? body.old_record : body.record;
      targetStaffId = record.staff_id;
      // We need to look up the auth_user_id for this staff member
      const { data: staff } = await supabaseAdmin
        .from('ic_staff')
        .select('auth_user_id')
        .eq('id', targetStaffId)
        .single();
      targetAuthUserId = staff?.auth_user_id;
    } else if (body.userId) {
       // Manual invocation fallback
       targetAuthUserId = body.userId;
    }

    if (!targetAuthUserId) {
      console.log('No valid auth_user_id found to sync. Exiting gracefully.');
      return new Response(JSON.stringify({ success: true, message: 'No sync required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Syncing JWT claims for Auth User: ${targetAuthUserId}`);

    // 2. Fetch the comprehensive state from the database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('ic_staff')
      .select('id, role_id, status')
      .eq('auth_user_id', targetAuthUserId)
      .maybeSingle();

    if (profileError) throw profileError;

    let is_admin = false;
    const permissions: Record<string, string> = {};
    let assigned_houses: string[] = [];
    const staff_id = profile?.id ?? null;

    // Only calculate active permissions if the profile is active
    if (profile && profile.status === 'active' && profile.role_id) {
      // Get Role Permissions
      const { data: rolePerms } = await supabaseAdmin
        .from('ic_role_permissions')
        .select('*')
        .eq('role_id', profile.role_id)
        .maybeSingle();

      if (rolePerms) {
        is_admin = rolePerms.access_control === 'full';
        PERMISSION_COLUMNS.forEach(col => {
          if (rolePerms[col]) permissions[col] = rolePerms[col];
        });
      }

      // Get House Assignments
      const { data: assignments } = await supabaseAdmin
        .from('ic_house_staff_assignments')
        .select('house_id')
        .eq('staff_id', staff_id);
      
      if (assignments) {
        assigned_houses = assignments.map(a => a.house_id);
      }
    }

    // 3. Prepare the new app_metadata payload
    const updateData = {
      app_metadata: {
        is_admin,
        staff_id,
        permissions,
        assigned_houses
      }
    };

    // 4. Inject into Supabase Auth
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetAuthUserId,
      updateData
    );

    if (updateError) throw updateError;

    console.log(`Successfully synced JWT for ${targetAuthUserId}. Admin: ${is_admin}, Houses: ${assigned_houses.length}`);

    return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Edge Function Sync Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

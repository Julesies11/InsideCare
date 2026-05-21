import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    console.log('Diagnostic: SUPABASE_URL present:', !!supabaseUrl);
    console.log('Diagnostic: SERVICE_ROLE_KEY present:', !!supabaseServiceKey);
    console.log('Diagnostic: SUPABASE_ANON_KEY present:', !!supabaseAnonKey);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Diagnostic: Missing Authorization header');
      throw new Error('Missing Authorization header');
    }

    const isServiceRole = authHeader === `Bearer ${supabaseServiceKey}`;
    console.log('Diagnostic: isServiceRole:', isServiceRole);
    console.log('Diagnostic: authHeader start:', authHeader.substring(0, 15) + '...');
    let isCallerAdmin = false;
    let callingUserId = '';

    // Module constants (Must match RBAC_MODULES in frontend)
    const ACCESS_CONTROL_MODULE = 'access_control';

    if (!isServiceRole) {
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !callingUser) {
        throw new Error('Unauthorized');
      }
      callingUserId = callingUser.id;

      // --- HARDENING: Server-Side Role Check ---
      const { data: callerProfile, error: callerError } = await supabaseAdmin
        .from('ic_staff')
        .select('id, role_id')
        .eq('auth_user_id', callingUser.id)
        .eq('status', 'active')
        .maybeSingle();

      if (callerError || !callerProfile) {
        console.error(`Unauthorized access attempt by user ${callingUser.id}`);
        throw new Error('Forbidden: Active staff profile required');
      }

      // Determine admin status by checking permissions for 'access_control' module
      const { data: callerPerms, error: permsError } = await supabaseAdmin
        .from('ic_role_permissions')
        .select(ACCESS_CONTROL_MODULE)
        .eq('role_id', callerProfile.role_id)
        .maybeSingle();

      if (permsError) throw permsError;
      isCallerAdmin = callerPerms?.[ACCESS_CONTROL_MODULE] === 'full';
    } else {
      isCallerAdmin = true;
      console.log('Authorized via Service Role');
    }
    // --- END HARDENING ---

    // 2. Get target userId from request
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }
    
    const { userId } = body;
    if (!userId) {
      throw new Error('userId is required');
    }

    // --- HARDENING: Self-Sync or Admin Sync ---
    const isSelfSync = !isServiceRole && callingUserId === userId;

    if (!isServiceRole && !isSelfSync && !isCallerAdmin) {
      console.error(`User ${callingUserId} attempted to sync permissions for ${userId} without admin rights.`);
      throw new Error('Forbidden: Admin access (full access_control) required for cross-user sync');
    }
    // --- END HARDENING ---

    console.log(`Syncing permissions for user: ${userId}`);

    // 3. Fetch Target Staff Profile & Role
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('ic_staff')
      .select(`
        id, 
        role_id, 
        manager_id, 
        auth_user_id,
        role:ic_roles(role_name)
      `)
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (staffError) throw staffError;
    if (!staff) {
      throw new Error(`Staff profile not found for user ${userId}`);
    }

    // 4. Fetch Role Permissions
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('ic_role_permissions')
      .select('*')
      .eq('role_id', staff.role_id)
      .maybeSingle();

    if (permError) throw permError;

    // 5. Fetch House Assignments
    const today = new Date().toISOString().split('T')[0];
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('ic_house_staff_assignments')
      .select('house_id')
      .eq('staff_id', staff.id)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (assignError) throw assignError;
    const assignedHouses = assignments?.map(a => a.house_id) || [];

    // 6. Fetch Managed Staff IDs (Direct Reports)
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('ic_staff')
      .select('id')
      .eq('manager_id', staff.id);

    if (reportsError) throw reportsError;
    const managedStaffIds = reports?.map(r => r.id) || [];

    // 7. Compile app_metadata
    // Clean up permissions object (remove DB internal fields)
    const { 
      id: _pId, 
      role_id: _rId, 
      created_at: _ca, 
      updated_at: _ua, 
      ...modulePermissions 
    } = permissions || {};

    const targetRoleName = staff.role?.role_name || '';
    const isTargetAdmin = modulePermissions?.[ACCESS_CONTROL_MODULE] === 'full';

    const app_metadata = {
      staff_id: staff.id,
      is_admin: isTargetAdmin,
      role_name: targetRoleName,
      permissions: modulePermissions,
      assigned_houses: assignedHouses,
      managed_staff_ids: managedStaffIds,
      last_sync: new Date().toISOString()
    };

    console.log(`Final metadata for ${userId}:`, JSON.stringify(app_metadata));

    // 8. Update Auth User app_metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata }
    );

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      success: true, 
      userId, 
      app_metadata 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Edge Function Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

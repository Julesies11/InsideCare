import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
      return new Response(
        JSON.stringify({ success: true, message: 'No sync required' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(`Syncing JWT claims for Auth User: ${targetAuthUserId}`);

    // 2. Fetch the comprehensive state from the database
    const { data: staff, error: profileError } = await supabaseAdmin
      .from('ic_staff')
      .select(
        `
        id, 
        role_id, 
        manager_id, 
        status,
        auth_user_id,
        role:ic_roles!staff_role_id_fkey(role_name)
      `,
      )
      .eq('auth_user_id', targetAuthUserId)
      .maybeSingle();

    if (profileError) throw profileError;

    let is_admin = false;
    let permissions: Record<string, string> = {};
    let assigned_houses: string[] = [];
    let managed_staff_ids: string[] = [];
    const staff_id = staff?.id ?? null;
    const role_id = staff?.role_id ?? null;
    const role_name = staff?.role?.role_name ?? '';

    // Only calculate active permissions if the profile is active
    if (staff && staff.status === 'active' && staff.role_id) {
      // Get Role Permissions
      const { data: rolePerms } = await supabaseAdmin
        .from('ic_role_permissions')
        .select('*')
        .eq('role_id', staff.role_id)
        .maybeSingle();

      if (rolePerms) {
        // Dynamically extract module permissions, excluding internal fields
        const {
          id: _pId,
          role_id: _rId,
          created_at: _ca,
          updated_at: _ua,
          created_by: _cb,
          updated_by: _ub,
          ...modulePermissions
        } = rolePerms;

        permissions = modulePermissions;
        is_admin = modulePermissions.access_control === 'full';
      }

      // Get House Assignments
      const { data: assignments } = await supabaseAdmin
        .from('ic_house_staff_assignments')
        .select('house_id')
        .eq('staff_id', staff_id);

      if (assignments) {
        assigned_houses = assignments.map((a) => a.house_id);
      }

      // Get Managed Staff IDs (Direct Reports)
      const { data: reports } = await supabaseAdmin
        .from('ic_staff')
        .select('id')
        .eq('manager_id', staff.id);

      if (reports) {
        managed_staff_ids = reports.map((r) => r.id);
      }
    }

    // 3. Prepare the new app_metadata payload (Unified Gold Standard Schema)
    const app_metadata = {
      staff_id,
      role_id,
      is_admin,
      role_name,
      permissions,
      assigned_houses,
      managed_staff_ids,
      last_sync: new Date().toISOString(),
    };

    // 4. Inject into Supabase Auth
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(targetAuthUserId, {
        app_metadata,
      });

    if (updateError) throw updateError;

    console.log(
      `Successfully synced JWT for ${targetAuthUserId}. Admin: ${is_admin}, Houses: ${assigned_houses.length}`,
    );

    return new Response(
      JSON.stringify({ success: true, user: updatedUser.user }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Edge Function Sync Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

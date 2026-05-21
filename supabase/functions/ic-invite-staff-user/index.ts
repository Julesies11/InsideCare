import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const isServiceRole = authHeader === `Bearer ${supabaseServiceKey}`;
    let isCallerAdmin = false;

    if (!isServiceRole) {
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !callingUser) {
        throw new Error('Unauthorized');
      }

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

      // Module constants (Must match RBAC_MODULES in frontend)
      const ACCESS_CONTROL_MODULE = 'access_control';

      // Determine admin status by checking permissions for 'access_control' module
      const { data: callerPerms, error: permsError } = await supabaseAdmin
        .from('ic_role_permissions')
        .select(ACCESS_CONTROL_MODULE)
        .eq('role_id', callerProfile.role_id)
        .maybeSingle();

      if (permsError) throw permsError;
      isCallerAdmin = callerPerms?.[ACCESS_CONTROL_MODULE] === 'full';

      if (!isCallerAdmin) {
        console.error(`User ${callingUser.id} attempted to invite users without admin rights.`);
        throw new Error('Forbidden: Admin access (full access_control) required');
      }
    } else {
      isCallerAdmin = true;
      console.log('Authorized via Service Role');
    }
    // --- END HARDENING ---

    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }

    const { staffId, email } = body;
    if (!staffId || !email) {
      throw new Error('staffId and email are required');
    }

    // Invite the user via Supabase admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { is_admin: false },
    });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authUserId = inviteData.user.id;

    // Link the auth user to the staff record
    const { error: updateError } = await supabaseAdmin
      .from('ic_staff')
      .update({ auth_user_id: authUserId })
      .eq('id', staffId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, authUserId }), {
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

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
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
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

      const {
        data: { user: callingUser },
        error: userError,
      } = await supabaseUser.auth.getUser();
      if (userError || !callingUser) {
        throw new Error('Unauthorized');
      }

      // --- Role Check ---
      const { data: callerProfile, error: callerError } = await supabaseAdmin
        .from('ic_staff')
        .select('id, role_id')
        .eq('auth_user_id', callingUser.id)
        .eq('status', 'active')
        .maybeSingle();

      if (callerError || !callerProfile) {
        throw new Error('Forbidden: Active staff profile required');
      }

      const ACCESS_CONTROL_MODULE = 'access_control';
      const { data: callerPerms, error: permsError } = await supabaseAdmin
        .from('ic_role_permissions')
        .select(ACCESS_CONTROL_MODULE)
        .eq('role_id', callerProfile.role_id)
        .maybeSingle();

      if (permsError) throw permsError;
      isCallerAdmin = callerPerms?.[ACCESS_CONTROL_MODULE] === 'full';

      if (!isCallerAdmin) {
        throw new Error(
          'Forbidden: Admin access (full access_control) required',
        );
      }
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }

    const { staffId, authUserId } = body;
    if (!staffId || !authUserId) {
      throw new Error('staffId and authUserId are required');
    }

    // SECURITY: Prevent a user from revoking their own access
    const callerId = req.headers.get('x-caller-id'); // Optional extra header for validation
    if (authUserId === callerId) {
      throw new Error('Forbidden: You cannot revoke your own portal access');
    }

    console.log(
      `Unlinking portal access: Staff ${staffId}, Auth ${authUserId}`,
    );

    // Delete the user from Supabase Auth
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(authUserId);

    // Note: If the user is already deleted, we still want to clear the staff record
    if (deleteError && !deleteError.message.includes('User not found')) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unlink the auth user from the staff record
    const { error: updateError } = await supabaseAdmin
      .from('ic_staff')
      .update({ auth_user_id: null })
      .eq('id', staffId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
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

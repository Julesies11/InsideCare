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

    // 1. Authenticate and Authorize the caller
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callingUser) {
      throw new Error('Unauthorized');
    }

    // --- Server-Side Role Check (Verify Admin) ---
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

    const ACCESS_CONTROL_MODULE = 'access_control';
    const { data: callerPerms, error: permsError } = await supabaseAdmin
      .from('ic_role_permissions')
      .select(ACCESS_CONTROL_MODULE)
      .eq('role_id', callerProfile.role_id)
      .maybeSingle();

    if (permsError) throw permsError;
    const isCallerAdmin = callerPerms?.[ACCESS_CONTROL_MODULE] === 'full';

    if (!isCallerAdmin) {
      console.error(`User ${callingUser.id} attempted to access auth status without admin rights.`);
      throw new Error('Forbidden: Admin access (full access_control) required');
    }
    // --- END HARDENING ---

    // 2. Fetch all users from Supabase Auth
    // Note: We might need to paginate if the staff count grows very large (>1000)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    
    if (listError) throw listError;

    // 3. Map to lightweight objects for the frontend
    const authStatusMap = users.reduce((acc, user) => {
      acc[user.id] = {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        confirmed_at: user.confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        invited_at: user.invited_at,
      };
      return acc;
    }, {} as Record<string, any>);

    return new Response(JSON.stringify(authStatusMap), {
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

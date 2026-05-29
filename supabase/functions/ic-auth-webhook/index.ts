import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the request is coming from Supabase Auth Webhook
    // Note: In a production environment, you should verify the webhook signature
    // for security. Supabase adds a header like 'x-supabase-signature'.
    
    const body = await req.json();
    console.log('Webhook payload received:', JSON.stringify(body, null, 2));

    // Refined extraction for different Supabase sources:
    // 1. Database Webhook on auth.sessions: body.record.user_id
    // 2. Auth Hook: body.user.id
    // 3. Database Webhook on auth.users: body.record.id
    const userRecord = body.record || body.user || body.data?.user;
    const authUserId = userRecord?.user_id || userRecord?.id;
    const email = userRecord?.email || 'unknown';

    if (!authUserId) {
      console.log('No user ID found in webhook payload. Payload structure:', Object.keys(body));
      return new Response(JSON.stringify({ message: 'No user data' }), { status: 200, headers: corsHeaders });
    }

    // 1. Look up the staff member's name for a better log entry
    // --- Shared Database Filter ---
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('ic_staff')
      .select('staff_name')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (staffError) {
      console.error('Error querying ic_staff:', staffError);
      throw staffError;
    }

    if (!staff) {
      console.log(`User ${email} (${authUserId}) signed in, but does not exist in ic_staff. Ignoring as they likely belong to another app in this shared database.`);
      return new Response(JSON.stringify({ success: true, message: 'Ignored: Non-InsideCare user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve the best display name
    const userName = staff.staff_name || 
                     userRecord?.user_metadata?.full_name || 
                     userRecord?.user_metadata?.name || 
                     email || 
                     'Unknown User';

    // 2. Log the activity

    const { error: logError } = await supabaseAdmin
      .from('ic_activity_log')
      .insert([{
        activity_type: 'login',
        entity_type: 'auth',
        entity_id: authUserId,
        entity_name: email,
        description: `User signed in: ${userName}`,
        user_name: userName,
        user_id: staff.id,
        table_name: 'auth.users',
        parent_type: 'Staff',
        metadata: {
          auth_user_id: authUserId,
          email: email,
          login_timestamp: new Date().toISOString(),
          ip_address: req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for'),
          user_agent: req.headers.get('user-agent'),
          hook_event: body.event || body.type || 'unknown'
        }
      }]);

    if (logError) {
      console.error('Error logging activity:', logError);
      throw logError;
    }

    console.log(`Login logged for user: ${userName} (${authUserId})`);

    // Compliant response for Auth Hooks
    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Webhook processing error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

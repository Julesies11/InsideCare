import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Validates and extracts a trusted origin to prevent open-redirect / token exfiltration vulnerabilities.
 */
function getTrustedOrigin(redirectTo?: string, requestOrigin?: string): string {
  const defaultOrigin = 'https://insidecare.app';
  const allowedDomains = ['insidecare.app', 'www.insidecare.app'];

  if (requestOrigin) {
    try {
      const url = new URL(requestOrigin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.origin;
      }
      if (allowedDomains.includes(url.hostname)) {
        return url.origin;
      }
    } catch (_) {
      // ignore
    }
  }

  if (redirectTo) {
    try {
      const url = new URL(redirectTo);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.origin;
      }
      if (allowedDomains.includes(url.hostname)) {
        return url.origin;
      }
    } catch (_) {
      // ignore
    }
  }

  return defaultOrigin;
}

async function sendResendEmail({
  apiKey,
  to,
  subject,
  html,
}: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'InsideCare Support <no-reply@insidecare.app>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      `Resend API error (${res.status}): ${errorJson.message || res.statusText}`,
    );
  }

  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const resendApiKey = Deno.env.get('IC_RESEND_API_KEY') ?? Deno.env.get('RESEND_API_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
        console.error(
          `User ${callingUser.id} attempted to invite users without admin rights.`,
        );
        throw new Error(
          'Forbidden: Admin access (full access_control) required',
        );
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

    const { staffId, email, redirectTo } = body;
    console.log(
      `Processing request for staff: ${staffId}, email: ${email}, redirectTo: ${redirectTo}`,
    );

    if (!staffId || !email) {
      throw new Error('staffId and email are required');
    }

    const clientOrigin = getTrustedOrigin(redirectTo, req.headers.get('origin') || undefined);

    // 1. Check if user already exists in Auth
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser && existingUser.confirmed_at) {
      console.log(
        `User ${email} is already confirmed. Processing password reset...`,
      );

      if (resendApiKey) {
        const { data: linkData, error: linkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: `${clientOrigin}/auth/change-password` },
          });

        if (linkError) {
          console.error('Supabase Auth Generate Link Error:', linkError.message);
          throw linkError;
        }

        const tokenHash = linkData.properties.hashed_token;
        const confirmUrl = `${clientOrigin}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=/auth/change-password`;

        await sendResendEmail({
          apiKey: resendApiKey,
          to: email,
          subject: 'Reset your InsideCare password',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 20px;">Reset Your Password</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">You requested to reset your password for InsideCare. Click the button below to set a new password:</p>
              <div style="margin-bottom: 24px;">
                <a href="${confirmUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.4; margin-bottom: 0;">If you didn't request this email, you can safely ignore it.</p>
            </div>
          `,
        });

        // Ensure staff record is linked
        await supabaseAdmin
          .from('ic_staff')
          .update({ auth_user_id: existingUser.id })
          .eq('id', staffId);

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset email sent via Resend' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      } else {
        // Fallback to default Supabase mailer if RESEND_API_KEY is not set
        console.warn('RESEND_API_KEY not set. Falling back to default Supabase mailer.');
        const { error: resetError } =
          await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${clientOrigin}/auth/change-password`,
          });

        if (resetError) {
          console.error('Password Reset Error:', resetError.message);
          return new Response(JSON.stringify({ error: resetError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabaseAdmin
          .from('ic_staff')
          .update({ auth_user_id: existingUser.id })
          .eq('id', staffId);

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset email sent' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // 2. If user doesn't exist or isn't confirmed, send/resend the invite
    console.log(`Sending/Resending invitation to ${email}...`);

    if (resendApiKey) {
      console.log('Using Resend API to send white-labeled invite email...');
      const { data: linkData, error: inviteError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            data: { is_admin: false },
            redirectTo: `${clientOrigin}/auth/change-password`,
          },
        });

      if (inviteError) {
        console.error('Supabase Auth Generate Link Error:', inviteError.message);
        return new Response(
          JSON.stringify({
            error: inviteError.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      const authUserId = linkData.user.id;
      const tokenHash = linkData.properties.hashed_token;
      const confirmUrl = `${clientOrigin}/auth/confirm?token_hash=${tokenHash}&type=invite&next=/auth/change-password`;

      await sendResendEmail({
        apiKey: resendApiKey,
        to: email,
        subject: 'You have been invited to InsideCare',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 20px;">Welcome to InsideCare</h2>
            <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">You have been invited to join the InsideCare platform. Click the button below to complete your registration and set your account password:</p>
            <div style="margin-bottom: 24px;">
              <a href="${confirmUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.4; margin-bottom: 0;">If you were not expecting this invitation, please contact your administrator.</p>
          </div>
        `,
      });

      // Link the auth user to the staff record
      const { error: updateError } = await supabaseAdmin
        .from('ic_staff')
        .update({ auth_user_id: authUserId })
        .eq('id', staffId);

      if (updateError) {
        console.error('Database Update Error:', updateError.message);
        throw updateError;
      }

      return new Response(JSON.stringify({ success: true, authUserId, via: 'resend' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Fallback if RESEND_API_KEY is not set
      console.warn('RESEND_API_KEY not set. Falling back to default Supabase mailer.');
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { is_admin: false },
          redirectTo: `${clientOrigin}/auth/change-password`,
        });

      if (inviteError) {
        console.error('Supabase Auth Invite Error:', inviteError.message);
        return new Response(
          JSON.stringify({
            error: inviteError.message,
            details: inviteError.message.includes('rate limit')
              ? 'You have exceeded the email rate limit. Please wait an hour or set RESEND_API_KEY.'
              : 'Ensure the redirectTo URL is in your Supabase Auth Redirect URLs allowlist.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      const authUserId = inviteData.user.id;
      const { error: updateError } = await supabaseAdmin
        .from('ic_staff')
        .update({ auth_user_id: authUserId })
        .eq('id', staffId);

      if (updateError) {
        console.error('Database Update Error:', updateError.message);
        throw updateError;
      }

      return new Response(JSON.stringify({ success: true, authUserId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Edge Function Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

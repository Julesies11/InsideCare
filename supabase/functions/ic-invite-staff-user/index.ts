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

function renderEmailTemplate({
  title,
  bodyText,
  buttonText,
  buttonUrl,
  footerNote,
}: {
  title: string;
  bodyText: string;
  buttonText: string;
  buttonUrl: string;
  footerNote: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Inside<span style="color: #2563eb;">Care</span></span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">${title}</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; text-align: center;">${bodyText}</p>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${buttonUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">${buttonText}</a>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; text-align: center;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">${footerNote}</p>
      </div>
    </div>
  `;
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
          html: renderEmailTemplate({
            title: 'Reset Your Password',
            bodyText: 'You requested to reset your password for InsideCare. Click the button below to set a new password:',
            buttonText: 'Reset Password',
            buttonUrl: confirmUrl,
            footerNote: "If you didn't request this email, you can safely ignore it.",
          }),
        });

        // Ensure staff record is linked and active
        await supabaseAdmin
          .from('ic_staff')
          .update({ auth_user_id: existingUser.id, status: 'active' })
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
        html: renderEmailTemplate({
          title: 'Welcome to InsideCare',
          bodyText: 'You have been invited to join the InsideCare platform. Click the button below to complete your registration and set your account password:',
          buttonText: 'Accept Invitation',
          buttonUrl: confirmUrl,
          footerNote: 'If you were not expecting this invitation, please contact your administrator.',
        }),
      });

      // Link the auth user to the staff record and activate profile
      const { data: staffRecord, error: updateError } = await supabaseAdmin
        .from('ic_staff')
        .update({ auth_user_id: authUserId, status: 'active' })
        .eq('id', staffId)
        .select('id, organisation_id, role_id')
        .maybeSingle();

      if (updateError) {
        console.error('Database Update Error:', updateError.message);
        throw updateError;
      }

      if (staffRecord?.organisation_id) {
        await supabaseAdmin
          .from('ic_staff_organisations')
          .upsert(
            {
              staff_id: staffId,
              organisation_id: staffRecord.organisation_id,
              role_id: staffRecord.role_id,
            },
            { onConflict: 'staff_id,organisation_id' },
          );
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
      const { data: staffRecord, error: updateError } = await supabaseAdmin
        .from('ic_staff')
        .update({ auth_user_id: authUserId, status: 'active' })
        .eq('id', staffId)
        .select('id, organisation_id, role_id')
        .maybeSingle();

      if (updateError) {
        console.error('Database Update Error:', updateError.message);
        throw updateError;
      }

      if (staffRecord?.organisation_id) {
        await supabaseAdmin
          .from('ic_staff_organisations')
          .upsert(
            {
              staff_id: staffId,
              organisation_id: staffRecord.organisation_id,
              role_id: staffRecord.role_id,
            },
            { onConflict: 'staff_id,organisation_id' },
          );
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

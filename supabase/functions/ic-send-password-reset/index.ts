// supabase/functions/ic-send-password-reset/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Validates and extracts a trusted origin to prevent open-redirect / token exfiltration vulnerabilities.
 */
function getTrustedOrigin(redirectTo?: string, requestOrigin?: string): string {
  const defaultOrigin = "https://insidecare.app";
  const allowedDomains = ["insidecare.app", "www.insidecare.app"];

  if (requestOrigin) {
    try {
      const url = new URL(requestOrigin);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
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
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("IC_RESEND_API_KEY") ?? Deno.env.get("RESEND_API_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables on server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let email: string | undefined;
    let redirectTo: string | undefined;

    try {
      const body = await req.json();
      email = body?.email;
      redirectTo = body?.redirectTo;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientOrigin = getTrustedOrigin(redirectTo, req.headers.get("origin") || undefined);

    // 1. Create a service role client to generate the password reset link
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Generate the recovery link securely
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${clientOrigin}/auth/change-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.warn("[generateLink Warning / User Not Found or Error]", linkError?.message);
      // Security Hardening: Return generic success to prevent user enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a reset link has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hashedToken = linkData.properties.hashed_token;
    const customActionLink = `${clientOrigin}/auth/confirm?token_hash=${hashedToken}&type=recovery&next=/auth/change-password`;

    // 3. Fallback for testing when Resend API Key is not set up yet
    if (!resendApiKey) {
      console.warn("IC_RESEND_API_KEY / RESEND_API_KEY is not set. Action link logged to console:");
      console.log(`[TESTING] Password reset link for ${email}: ${customActionLink}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password reset link generated but RESEND_API_KEY is not configured. Link logged to Deno console logs for testing." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Send email using Resend API via fetch
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InsideCare Support <no-reply@insidecare.app>",
        to: [email],
        subject: "Reset your InsideCare password",
        html: renderEmailTemplate({
          title: "Reset your password",
          bodyText: "We received a request to reset the password for your InsideCare account. Click the button below to choose a new password. This link will expire in 1 hour.",
          buttonText: "Reset Password",
          buttonUrl: customActionLink,
          footerNote: "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.",
        }),
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json().catch(() => ({ message: "Failed to deliver email" }));
      console.error("[Resend Error Details]", resendError);
      return new Response(
        JSON.stringify({ error: `Resend Email Error: ${resendError.message || "Failed to deliver email"}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists with this email, a reset link has been sent." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(`[ic-send-password-reset Error]`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

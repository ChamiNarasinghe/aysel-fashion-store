import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { RECOVERY_COOKIE, getRedirectType, signRecoveryCookie } from "@/lib/recovery-cookie";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
  }

  const supabase = await createSupabaseServerClient();

  // Exchange the PKCE auth code for a session.  On success, data contains
  // { user, session, redirectType }.  redirectType is "recovery" only when
  // the code was issued by resetPasswordForEmail(); it is null/undefined for
  // signup confirmation, magic-link sign-in, and OAuth flows.
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
  }

  // getRedirectType performs a safe runtime narrowing — no `any` at call sites.
  const redirectType = getRedirectType(data);

  if (redirectType === "recovery" && data?.user?.id) {
    // Genuine password-recovery flow.  Set a short-lived HttpOnly signed cookie
    // so the reset-password Server Component can confirm this browser completed
    // a real recovery exchange.  The cookie value is HMAC-signed and bound to
    // the authenticated user ID — it cannot be forged by setting cookie=1.
    const response = NextResponse.redirect(new URL("/reset-password", origin));
    response.cookies.set(RECOVERY_COOKIE, signRecoveryCookie(data.user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/reset-password",
      maxAge: 600, // 10 minutes
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  // Signup confirmation, magic-link, OAuth, etc. — redirect to the validated
  // destination.  getSafeRedirect rejects external URLs and protocol-relative
  // paths, falling back to "/" for anything suspicious.
  return NextResponse.redirect(new URL(getSafeRedirect(next), origin));
}

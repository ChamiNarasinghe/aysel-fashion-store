"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, verifyRecoveryCookie } from "@/lib/recovery-cookie";

export type UpdatePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("same password") || m.includes("different from")) {
    return "Your new password must be different from your current password.";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "Please choose a stronger password.";
  }
  if (m.includes("session") || m.includes("expired") || m.includes("jwt")) {
    return "Your reset session has expired. Please request a new reset link.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Failed to update password. Please try again.";
}

export async function updatePassword(
  password: string
): Promise<UpdatePasswordResult> {
  const cookieStore = await cookies();

  // ── Guard 1: live Supabase session ─────────────────────────────────────────
  // getUser() validates the access token against the Supabase Auth server —
  // it is not read from local storage and cannot be spoofed by the client.
  // We do this FIRST so we have the user ID to bind against the cookie.
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: "Your reset session has expired. Please request a new reset link.",
    };
  }

  // ── Guard 2: signed recovery cookie ──────────────────────────────────────
  // The cookie is HttpOnly and was set exclusively by the callback route after
  // a genuine PKCE recovery exchange.  The value is HMAC-signed and bound to
  // the authenticated user ID — a forged or replayed cookie is rejected here.
  const recoveryCookie = cookieStore.get(RECOVERY_COOKIE);
  if (!verifyRecoveryCookie(recoveryCookie?.value, user.id)) {
    return {
      ok: false,
      error: "Your reset session has expired. Please request a new reset link.",
    };
  }

  // ── Perform the update ────────────────────────────────────────────────────
  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    // Do NOT invalidate the cookie on failure — the user should be able to
    // correct their input and try again within the 10-minute window.
    return { ok: false, error: friendlyError(updateError.message) };
  }

  // ── Post-update cleanup ───────────────────────────────────────────────────
  // Invalidate the recovery cookie immediately so it cannot be replayed.
  cookieStore.set(RECOVERY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/reset-password",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  // Sign out the recovery session so the user must log in fresh with their
  // new password.  Use scope "local" to avoid signing out other devices.
  await supabase.auth.signOut({ scope: "local" });

  return { ok: true };
}

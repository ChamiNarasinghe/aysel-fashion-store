"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateChangePasswordServer } from "@/lib/change-password-validation";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; field?: "currentPassword"; error: string };

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("wrong")) {
    return "Current password is incorrect.";
  }
  if (m.includes("same password") || m.includes("different from")) {
    return "New password must differ from your current password.";
  }
  if (m.includes("weak") || m.includes("strength")) {
    return "Please choose a stronger password.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "A network error occurred. Please check your connection and try again.";
  }
  return "Failed to update password. Please try again.";
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> {
  // Server-side validation — never trust client input.
  const validationError = validateChangePasswordServer({
    currentPassword,
    newPassword,
    confirmPassword,
  });
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createSupabaseServerClient();

  // Verify the authenticated session — user ID and email are taken from the
  // server-validated session, never from the client.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return {
      ok: false,
      error: "Your session has expired. Please sign in again.",
    };
  }

  // Re-authenticate with the current password to prove the customer knows it.
  // signInWithPassword is used on the server-side client so the session cookie
  // is refreshed in place — the customer stays logged in after the update.
  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reAuthError) {
    return {
      ok: false,
      field: "currentPassword",
      error: "Current password is incorrect.",
    };
  }

  // Update to the new password.
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { ok: false, error: friendlyError(updateError.message) };
  }

  return { ok: true };
}

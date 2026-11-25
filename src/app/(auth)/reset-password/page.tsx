import { cookies } from "next/headers";
import type { Metadata } from "next";
import { RECOVERY_COOKIE, verifyRecoveryCookie } from "@/lib/recovery-cookie";
import ResetPasswordForm, { RecoveryExpired } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

// Do not cache this page — the recovery cookie must be read fresh on every
// request so that expiry is respected and page refreshes within the 10-minute
// window continue to work.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();

  // The recovery cookie is HttpOnly and was set exclusively by the callback
  // route after a genuine PKCE recovery exchange.  Reading it here on the
  // server means the client never has access to it and cannot forge it.
  //
  // We intentionally do NOT delete the cookie on render.  The user may need
  // to refresh the page (e.g. after a network error) and should not lose
  // access within the 10-minute validity window.  The cookie is deleted by
  // the Server Action only after a successful password update.
  const recoveryCookie = cookieStore.get(RECOVERY_COOKIE);
  const isAuthorized = verifyRecoveryCookie(recoveryCookie?.value);

  if (!isAuthorized) {
    return <RecoveryExpired />;
  }

  return <ResetPasswordForm />;
}

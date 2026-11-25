/**
 * Shared helpers for the password-recovery cookie flow.
 *
 * The cookie is set server-side (HttpOnly) by the auth callback route after a
 * successful PKCE exchange whose redirectType equals "recovery".  It is read
 * by the reset-password Server Component and verified by the password-update
 * Server Action before any write is performed.
 *
 * Security properties
 * ───────────────────
 * • The cookie is HttpOnly — JavaScript running in the browser cannot read,
 *   set, or delete it.
 * • It is scoped to Path=/reset-password so it is not sent on any other route.
 * • It carries a 600-second maxAge (10 minutes) — enough to fill in the form.
 * • It is Secure in production so it is never sent over plain HTTP.
 * • SameSite=Lax prevents cross-site request forgery while allowing the
 *   top-level navigation redirect from the email link to carry the cookie.
 *
 * Cookie value format (signed)
 * ────────────────────────────
 * The cookie value is NOT a static "1".  It is a signed token of the form:
 *
 *   <userId>.<expiresAt>.<hmac>
 *
 * where:
 *   userId    — the Supabase user UUID from the recovery session
 *   expiresAt — Unix timestamp (seconds) when the token expires (now + 600s)
 *   hmac      — HMAC-SHA256(userId + "." + expiresAt, RECOVERY_SIGNING_SECRET)
 *               encoded as hex
 *
 * This means:
 *   • An attacker who manually submits cookie=1 is rejected (wrong format).
 *   • An attacker who forges a valid-looking token is rejected (HMAC fails).
 *   • A token for user A cannot authorise user B (userId is in the signed payload).
 *   • A token past its expiresAt is rejected even if the HMAC is valid.
 *   • The signing secret is server-only (never sent to the browser).
 *
 * Replay / stale-cookie scenarios
 * ────────────────────────────────
 * • The PKCE code is single-use: replaying the same email link after the first
 *   exchange returns an error from Supabase, so the cookie is never re-set.
 * • The cookie expires after 10 minutes.  A page refresh within that window
 *   keeps the cookie alive (the browser re-sends it on every request to
 *   /reset-password) — this is intentional so the user can correct a typo
 *   without losing access.
 * • After a successful password update the Server Action explicitly deletes the
 *   cookie (maxAge=0) so it cannot be replayed.
 * • The Server Action also calls getUser() to verify the Supabase session is
 *   still valid before performing the update, so an expired Supabase session
 *   is caught independently of the cookie.
 *
 * Environment variable
 * ────────────────────
 * RECOVERY_SIGNING_SECRET — a hex-encoded 32-byte (256-bit) random secret.
 * Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Add to .env.local (never commit the real value).
 * See .env.example for the placeholder.
 */

import { createHmac, timingSafeEqual } from "crypto";

export const RECOVERY_COOKIE = "sb-recovery-verified";

/** Token lifetime in seconds — must match the cookie maxAge. */
const TOKEN_TTL = 600;

// ── Signing secret ────────────────────────────────────────────────────────────

function getSigningSecret(): Buffer {
  const raw = process.env.RECOVERY_SIGNING_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "RECOVERY_SIGNING_SECRET is missing or too short. " +
      "Generate a 32-byte hex secret and add it to .env.local."
    );
  }
  return Buffer.from(raw, "hex");
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

function computeHmac(payload: string, secret: Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates a signed recovery cookie value bound to the given user ID.
 * The token encodes an expiry timestamp and is HMAC-signed so it cannot
 * be forged or transferred to a different user.
 */
export function signRecoveryCookie(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const payload = `${userId}.${expiresAt}`;
  const hmac = computeHmac(payload, getSigningSecret());
  return `${payload}.${hmac}`;
}

/**
 * Verifies a recovery cookie value.
 *
 * @param cookieValue  The raw cookie string from the request.
 * @param userId       When provided (Server Action), the token's embedded
 *                     userId must match this value exactly.  When omitted
 *                     (Server Component gate), only structural validity and
 *                     HMAC correctness are checked.
 * @returns  true if the token is structurally valid, not expired, HMAC-correct,
 *           and (if userId supplied) bound to the expected user.
 */
export function verifyRecoveryCookie(
  cookieValue: string | undefined,
  userId?: string
): boolean {
  if (!cookieValue) return false;

  const parts = cookieValue.split(".");
  // Format: <userId>.<expiresAt>.<hmac>
  // userId is a UUID (no dots), expiresAt is a number, hmac is hex — 3 parts.
  if (parts.length !== 3) return false;

  const [tokenUserId, expiresAtStr, tokenHmac] = parts;

  // Validate expiry.
  const expiresAt = parseInt(expiresAtStr, 10);
  if (!Number.isFinite(expiresAt)) return false;
  if (Math.floor(Date.now() / 1000) > expiresAt) return false;

  // Validate HMAC using timing-safe comparison.
  let secret: Buffer;
  try {
    secret = getSigningSecret();
  } catch {
    return false;
  }

  const payload = `${tokenUserId}.${expiresAtStr}`;
  const expectedHmac = computeHmac(payload, secret);

  // timingSafeEqual requires same-length buffers.
  const tokenHmacBuf = Buffer.from(tokenHmac, "hex");
  const expectedHmacBuf = Buffer.from(expectedHmac, "hex");
  if (tokenHmacBuf.length !== expectedHmacBuf.length) return false;

  if (!timingSafeEqual(tokenHmacBuf, expectedHmacBuf)) return false;

  // If a userId was supplied (Server Action), enforce binding.
  if (userId !== undefined && tokenUserId !== userId) return false;

  return true;
}

/**
 * Safely extracts `redirectType` from the opaque data object returned by
 * `supabase.auth.exchangeCodeForSession()`.
 *
 * The Supabase auth-js SDK (v2.119.2) does NOT include `redirectType` in the
 * exported TypeScript types (AuthTokenResponse only declares `user` and
 * `session`), but it IS present at runtime.  The value is extracted from the
 * PKCE verifier storage item (format: "<codeVerifier>/<redirectType>") and
 * returned as part of the data object.
 *
 * Confirmed in @supabase/auth-js dist/main/GoTrueClient.js:
 *   const [codeVerifier, redirectType] = (storageItem ?? '').split('/');
 *   return this._returnResult({ data: { ...data, redirectType: redirectType ?? null }, error });
 *
 * Rather than scattering `(data as any)` casts across the codebase, this
 * single helper performs the narrowing in one place and returns `string | null`.
 *
 * The check is deliberately conservative:
 *   • If `data` is not an object, returns null.
 *   • If `redirectType` is not a string, returns null.
 *   • Never throws.
 */
export function getRedirectType(data: unknown): string | null {
  if (data === null || typeof data !== "object") return null;
  const rt = (data as Record<string, unknown>).redirectType;
  return typeof rt === "string" ? rt : null;
}

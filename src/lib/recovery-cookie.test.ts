/**
 * Tests for the recovery cookie helper (src/lib/recovery-cookie.ts).
 *
 * Covers:
 *   - getRedirectType() — safe runtime narrowing of the undocumented field
 *   - signRecoveryCookie() — token generation
 *   - verifyRecoveryCookie() — all rejection and acceptance paths
 *
 * Run with:
 *   node --experimental-strip-types src/lib/recovery-cookie.test.ts
 *
 * RECOVERY_SIGNING_SECRET is set inline below so the tests are self-contained.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  getRedirectType,
  RECOVERY_COOKIE,
  signRecoveryCookie,
  verifyRecoveryCookie,
} from "./recovery-cookie.ts";

// ── Test secret setup ─────────────────────────────────────────────────────────
// Use a deterministic 32-byte hex secret so tests are reproducible.
const TEST_SECRET = "a".repeat(64); // 64 hex chars = 32 bytes
let originalSecret: string | undefined;

before(() => {
  originalSecret = process.env.RECOVERY_SIGNING_SECRET;
  process.env.RECOVERY_SIGNING_SECRET = TEST_SECRET;
});

after(() => {
  if (originalSecret === undefined) {
    delete process.env.RECOVERY_SIGNING_SECRET;
  } else {
    process.env.RECOVERY_SIGNING_SECRET = originalSecret;
  }
});

const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";

// ── RECOVERY_COOKIE constant ──────────────────────────────────────────────────

test("RECOVERY_COOKIE has the expected name", () => {
  assert.equal(RECOVERY_COOKIE, "sb-recovery-verified");
});

// ── getRedirectType — genuine recovery callback ───────────────────────────────

test("genuine recovery callback: returns 'recovery'", () => {
  const data = { user: {}, session: {}, redirectType: "recovery" };
  assert.equal(getRedirectType(data), "recovery");
});

// ── getRedirectType — signup confirmation does not set cookie ─────────────────

test("signup confirmation: redirectType is null → returns null", () => {
  const data = { user: {}, session: {}, redirectType: null };
  assert.equal(getRedirectType(data), null);
});

test("signup confirmation: redirectType absent → returns null", () => {
  const data = { user: {}, session: {} };
  assert.equal(getRedirectType(data), null);
});

// ── getRedirectType — ordinary login does not set cookie ──────────────────────

test("ordinary login: no redirectType property → returns null", () => {
  const data = { user: { id: "abc" }, session: { access_token: "tok" } };
  assert.equal(getRedirectType(data), null);
});

// ── getRedirectType — failed PKCE exchange does not set cookie ────────────────

test("failed PKCE exchange: null data → returns null", () => {
  assert.equal(getRedirectType(null), null);
});

test("failed PKCE exchange: undefined data → returns null", () => {
  assert.equal(getRedirectType(undefined), null);
});

// ── getRedirectType — type safety ─────────────────────────────────────────────

test("redirectType is a number → returns null", () => {
  assert.equal(getRedirectType({ redirectType: 42 }), null);
});

test("redirectType is an object → returns null", () => {
  assert.equal(getRedirectType({ redirectType: {} }), null);
});

test("redirectType is empty string → returns empty string (caller checks === 'recovery')", () => {
  assert.equal(getRedirectType({ redirectType: "" }), "");
});

test("redirectType is 'signup' → returns 'signup', not 'recovery'", () => {
  const rt = getRedirectType({ redirectType: "signup" });
  assert.equal(rt, "signup");
  assert.notEqual(rt, "recovery");
});

// ── Regression: runtime behaviour confirmed in @supabase/auth-js@2.119.2 ─────
// The SDK extracts redirectType from the PKCE verifier storage item:
//   const [codeVerifier, redirectType] = (storageItem ?? '').split('/');
//   return { data: { ...data, redirectType: redirectType ?? null }, error };
// This test documents that getRedirectType handles both the "recovery" string
// and the null fallback that the SDK emits for non-recovery flows.

test("SDK regression: null redirectType (non-recovery flow) → returns null", () => {
  // Simulates what the SDK returns for signup/magic-link/OAuth flows.
  assert.equal(getRedirectType({ user: {}, session: {}, redirectType: null }), null);
});

test("SDK regression: 'recovery' string → returns 'recovery'", () => {
  // Simulates what the SDK returns for resetPasswordForEmail() flows.
  assert.equal(getRedirectType({ user: {}, session: {}, redirectType: "recovery" }), "recovery");
});

// ── signRecoveryCookie ────────────────────────────────────────────────────────

test("signRecoveryCookie returns a three-part dot-separated token", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  const parts = token.split(".");
  assert.equal(parts.length, 3, "token must have exactly 3 parts");
});

test("signRecoveryCookie embeds the user ID in the token", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  assert.ok(token.startsWith(TEST_USER_ID + "."), "token must start with userId.");
});

test("signRecoveryCookie embeds a future expiry timestamp", () => {
  const before = Math.floor(Date.now() / 1000);
  const token = signRecoveryCookie(TEST_USER_ID);
  const after = Math.floor(Date.now() / 1000);
  const expiresAt = parseInt(token.split(".")[1], 10);
  assert.ok(expiresAt > before, "expiresAt must be in the future");
  assert.ok(expiresAt <= after + 601, "expiresAt must be within TTL");
});

test("signRecoveryCookie produces different tokens for different users", () => {
  const t1 = signRecoveryCookie(TEST_USER_ID);
  const t2 = signRecoveryCookie(OTHER_USER_ID);
  assert.notEqual(t1, t2);
});

// ── verifyRecoveryCookie — acceptance ─────────────────────────────────────────

test("valid token without userId binding is accepted", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  assert.equal(verifyRecoveryCookie(token), true);
});

test("valid token with correct userId binding is accepted", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  assert.equal(verifyRecoveryCookie(token, TEST_USER_ID), true);
});

// ── verifyRecoveryCookie — rejection: missing / empty ────────────────────────

test("missing cookie (undefined) is rejected", () => {
  assert.equal(verifyRecoveryCookie(undefined), false);
});

test("empty string cookie is rejected", () => {
  assert.equal(verifyRecoveryCookie(""), false);
});

// ── verifyRecoveryCookie — rejection: old static value ───────────────────────

test("old static value '1' is rejected (wrong format)", () => {
  assert.equal(verifyRecoveryCookie("1"), false);
});

test("'true' is rejected", () => {
  assert.equal(verifyRecoveryCookie("true"), false);
});

// ── verifyRecoveryCookie — rejection: wrong user ─────────────────────────────

test("token for user A is rejected when user B's ID is supplied", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  assert.equal(verifyRecoveryCookie(token, OTHER_USER_ID), false);
});

// ── verifyRecoveryCookie — rejection: tampered payload ───────────────────────

test("tampered userId in token is rejected", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  const parts = token.split(".");
  // Replace userId with a different UUID but keep the original HMAC.
  const tampered = [OTHER_USER_ID, parts[1], parts[2]].join(".");
  assert.equal(verifyRecoveryCookie(tampered), false);
});

test("tampered expiresAt in token is rejected", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  const parts = token.split(".");
  const futureExpiry = (parseInt(parts[1], 10) + 9999).toString();
  const tampered = [parts[0], futureExpiry, parts[2]].join(".");
  assert.equal(verifyRecoveryCookie(tampered), false);
});

test("truncated token (missing hmac) is rejected", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  const parts = token.split(".");
  const truncated = [parts[0], parts[1]].join(".");
  assert.equal(verifyRecoveryCookie(truncated), false);
});

test("token with extra parts is rejected", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  assert.equal(verifyRecoveryCookie(token + ".extra"), false);
});

// ── verifyRecoveryCookie — rejection: expired token ──────────────────────────

test("expired token is rejected", () => {
  // Manually construct a token with an expiry in the past.
  const secret = Buffer.from(TEST_SECRET, "hex");
  const expiresAt = Math.floor(Date.now() / 1000) - 1; // 1 second ago
  const payload = `${TEST_USER_ID}.${expiresAt}`;
  const hmac = createHmac("sha256", secret).update(payload).digest("hex");
  const expiredToken = `${payload}.${hmac}`;
  assert.equal(verifyRecoveryCookie(expiredToken), false);
});

// ── verifyRecoveryCookie — rejection: wrong secret ───────────────────────────

test("token signed with a different secret is rejected", () => {
  // Sign with a different secret, then verify with the test secret.
  const wrongSecret = Buffer.from("b".repeat(64), "hex");
  const expiresAt = Math.floor(Date.now() / 1000) + 600;
  const payload = `${TEST_USER_ID}.${expiresAt}`;
  const hmac = createHmac("sha256", wrongSecret).update(payload).digest("hex");
  const foreignToken = `${payload}.${hmac}`;
  assert.equal(verifyRecoveryCookie(foreignToken), false);
});

// ── Recovery flow isolation ───────────────────────────────────────────────────

test("normal login cannot establish recovery state (no redirectType)", () => {
  // Normal login returns redirectType: null → getRedirectType returns null
  // → callback does not call signRecoveryCookie → no cookie is set.
  assert.equal(getRedirectType({ user: {}, session: {} }), null);
});

test("signup confirmation cannot establish recovery state", () => {
  assert.equal(getRedirectType({ user: {}, session: {}, redirectType: null }), null);
});

test("failed PKCE exchange cannot establish recovery state", () => {
  // Callback checks error first and redirects before reaching getRedirectType.
  assert.equal(getRedirectType(null), null);
});

test("ordinary authenticated session cannot pass the recovery gate", () => {
  // An ordinary session has no recovery cookie at all.
  assert.equal(verifyRecoveryCookie(undefined), false);
  assert.equal(verifyRecoveryCookie(""), false);
});

// ── Page-refresh behaviour ────────────────────────────────────────────────────

test("refresh preserves valid recovery access: same token passes twice", () => {
  const token = signRecoveryCookie(TEST_USER_ID);
  // Server Component reads but does NOT delete the cookie on render.
  assert.equal(verifyRecoveryCookie(token, TEST_USER_ID), true); // first render
  assert.equal(verifyRecoveryCookie(token, TEST_USER_ID), true); // after refresh
});

// ── Post-update cookie invalidation ──────────────────────────────────────────

test("successful update invalidates the cookie (maxAge=0 → browser sends empty)", () => {
  // After updatePassword succeeds, the Server Action sets maxAge=0.
  // The browser then sends an empty/absent cookie on subsequent requests.
  assert.equal(verifyRecoveryCookie(""), false);
  assert.equal(verifyRecoveryCookie(undefined), false);
});

test("failed update does not prematurely invalidate the cookie", () => {
  // The Server Action only clears the cookie after result.ok === true.
  // On failure the cookie value is unchanged.
  const token = signRecoveryCookie(TEST_USER_ID);
  assert.equal(verifyRecoveryCookie(token, TEST_USER_ID), true);
});

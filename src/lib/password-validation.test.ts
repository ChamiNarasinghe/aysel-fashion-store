/**
 * Tests for password reset form validation.
 *
 * Run with:  node --experimental-strip-types src/lib/password-validation.test.ts
 * Or via:    npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ── Inline the validation logic (mirrors reset-password/page.tsx) ────────────
// Kept here rather than importing the page to avoid React/Next.js module deps.

type Fields = { password: string; confirmPassword: string };
type Errors = Partial<Record<keyof Fields, string>>;

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

// ── Valid inputs ──────────────────────────────────────────────────────────────

test("valid matching passwords produce no errors", () => {
  const result = validate({ password: "SecurePass1", confirmPassword: "SecurePass1" });
  assert.deepEqual(result, {});
});

test("exactly 8 characters is accepted", () => {
  const result = validate({ password: "12345678", confirmPassword: "12345678" });
  assert.deepEqual(result, {});
});

test("long password is accepted", () => {
  const pw = "a".repeat(64);
  const result = validate({ password: pw, confirmPassword: pw });
  assert.deepEqual(result, {});
});

// ── Password field errors ─────────────────────────────────────────────────────

test("empty password produces required error", () => {
  const result = validate({ password: "", confirmPassword: "" });
  assert.equal(result.password, "Password is required.");
});

test("7-character password is rejected", () => {
  const result = validate({ password: "1234567", confirmPassword: "1234567" });
  assert.equal(result.password, "Password must be at least 8 characters.");
});

test("1-character password is rejected", () => {
  const result = validate({ password: "a", confirmPassword: "a" });
  assert.equal(result.password, "Password must be at least 8 characters.");
});

// ── Confirm password field errors ─────────────────────────────────────────────

test("empty confirm password produces required error", () => {
  const result = validate({ password: "SecurePass1", confirmPassword: "" });
  assert.equal(result.confirmPassword, "Please confirm your password.");
});

test("mismatched passwords produce mismatch error", () => {
  const result = validate({ password: "SecurePass1", confirmPassword: "DifferentPass1" });
  assert.equal(result.confirmPassword, "Passwords do not match.");
});

test("case-sensitive mismatch is caught", () => {
  const result = validate({ password: "SecurePass1", confirmPassword: "securepass1" });
  assert.equal(result.confirmPassword, "Passwords do not match.");
});

// ── Both fields empty ─────────────────────────────────────────────────────────

test("both fields empty produces two errors", () => {
  const result = validate({ password: "", confirmPassword: "" });
  assert.equal(result.password, "Password is required.");
  assert.equal(result.confirmPassword, "Please confirm your password.");
});

// ── Short password with confirm ───────────────────────────────────────────────

test("short password with matching confirm still fails on length", () => {
  const result = validate({ password: "short", confirmPassword: "short" });
  assert.equal(result.password, "Password must be at least 8 characters.");
  assert.equal(result.confirmPassword, undefined);
});

test("short password with mismatched confirm fails on both", () => {
  const result = validate({ password: "short", confirmPassword: "different" });
  assert.equal(result.password, "Password must be at least 8 characters.");
  assert.equal(result.confirmPassword, "Passwords do not match.");
});

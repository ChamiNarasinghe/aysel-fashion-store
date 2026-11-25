/**
 * Tests for change-password form validation.
 *
 * Run with:  node --experimental-strip-types src/lib/change-password-validation.test.ts
 * Or via:    npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateChangePasswordForm,
  validateChangePasswordServer,
  type ChangePasswordFields,
} from "./change-password-validation.ts";

// ── validateChangePasswordForm ────────────────────────────────────────────────

test("valid fields produce no errors", () => {
  const f: ChangePasswordFields = {
    currentPassword: "OldPass1",
    newPassword: "NewPass99",
    confirmPassword: "NewPass99",
  };
  assert.deepEqual(validateChangePasswordForm(f), {});
});

test("all fields empty produces three errors", () => {
  const result = validateChangePasswordForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  assert.equal(result.currentPassword, "Current password is required.");
  assert.equal(result.newPassword, "New password is required.");
  assert.equal(result.confirmPassword, "Please confirm your new password.");
});

test("missing current password", () => {
  const result = validateChangePasswordForm({
    currentPassword: "",
    newPassword: "NewPass99",
    confirmPassword: "NewPass99",
  });
  assert.equal(result.currentPassword, "Current password is required.");
  assert.equal(result.newPassword, undefined);
  assert.equal(result.confirmPassword, undefined);
});

test("new password shorter than 8 characters is rejected", () => {
  const result = validateChangePasswordForm({
    currentPassword: "OldPass1",
    newPassword: "short",
    confirmPassword: "short",
  });
  assert.equal(result.newPassword, "Password must be at least 8 characters.");
});

test("exactly 8 characters is accepted", () => {
  const result = validateChangePasswordForm({
    currentPassword: "OldPass1",
    newPassword: "12345678",
    confirmPassword: "12345678",
  });
  assert.equal(result.newPassword, undefined);
});

test("new password same as current password is rejected", () => {
  const result = validateChangePasswordForm({
    currentPassword: "SamePass1",
    newPassword: "SamePass1",
    confirmPassword: "SamePass1",
  });
  assert.equal(result.newPassword, "New password must differ from your current password.");
});

test("new password mismatch with confirm", () => {
  const result = validateChangePasswordForm({
    currentPassword: "OldPass1",
    newPassword: "NewPass99",
    confirmPassword: "NewPass00",
  });
  assert.equal(result.confirmPassword, "Passwords do not match.");
});

test("case-sensitive mismatch is caught", () => {
  const result = validateChangePasswordForm({
    currentPassword: "OldPass1",
    newPassword: "NewPass99",
    confirmPassword: "newpass99",
  });
  assert.equal(result.confirmPassword, "Passwords do not match.");
});

test("missing confirm password", () => {
  const result = validateChangePasswordForm({
    currentPassword: "OldPass1",
    newPassword: "NewPass99",
    confirmPassword: "",
  });
  assert.equal(result.confirmPassword, "Please confirm your new password.");
});

test("same-as-current check is skipped when currentPassword is empty", () => {
  // currentPassword is empty so we cannot compare — only the required error fires
  const result = validateChangePasswordForm({
    currentPassword: "",
    newPassword: "AnyPass1",
    confirmPassword: "AnyPass1",
  });
  assert.equal(result.newPassword, undefined);
});

// ── validateChangePasswordServer ─────────────────────────────────────────────

test("server: valid fields return null", () => {
  assert.equal(
    validateChangePasswordServer({
      currentPassword: "OldPass1",
      newPassword: "NewPass99",
      confirmPassword: "NewPass99",
    }),
    null
  );
});

test("server: missing current password", () => {
  assert.equal(
    validateChangePasswordServer({
      currentPassword: "",
      newPassword: "NewPass99",
      confirmPassword: "NewPass99",
    }),
    "Current password is required."
  );
});

test("server: short new password", () => {
  assert.equal(
    validateChangePasswordServer({
      currentPassword: "OldPass1",
      newPassword: "short",
      confirmPassword: "short",
    }),
    "Password must be at least 8 characters."
  );
});

test("server: mismatched confirm", () => {
  assert.equal(
    validateChangePasswordServer({
      currentPassword: "OldPass1",
      newPassword: "NewPass99",
      confirmPassword: "Different1",
    }),
    "Passwords do not match."
  );
});

test("server: new password same as current password is rejected", () => {
  assert.equal(
    validateChangePasswordServer({
      currentPassword: "SamePass1",
      newPassword: "SamePass1",
      confirmPassword: "SamePass1",
    }),
    "New password must differ from your current password."
  );
});

test("server: same-as-current check runs before confirm check", () => {
  // Even if confirm also mismatches, the same-as-current error fires first.
  assert.equal(
    validateChangePasswordServer({
      currentPassword: "SamePass1",
      newPassword: "SamePass1",
      confirmPassword: "Different1",
    }),
    "New password must differ from your current password."
  );
});

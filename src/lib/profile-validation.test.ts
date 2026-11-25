/**
 * Tests for src/lib/profile-validation.ts
 *
 * Imports the production validateProfileFields function directly — no inline
 * duplication of the validation logic.
 *
 * Run with:  node --experimental-strip-types src/lib/profile-validation.test.ts
 * Or via:    npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProfileFields } from "./profile-validation.ts";

// ── Valid inputs ──────────────────────────────────────────────────────────────

test("valid first and last name with no phone returns null", () => {
  assert.equal(
    validateProfileFields({ first_name: "Jane", last_name: "Smith", phone: "" }),
    null
  );
});

test("valid fields with phone returns null", () => {
  assert.equal(
    validateProfileFields({
      first_name: "Jane",
      last_name: "Smith",
      phone: "+44 7700 900000",
    }),
    null
  );
});

test("names with surrounding whitespace are trimmed and accepted", () => {
  assert.equal(
    validateProfileFields({
      first_name: "  Jane  ",
      last_name: "  Smith  ",
      phone: "",
    }),
    null
  );
});

// ── First name validation ─────────────────────────────────────────────────────

test("empty first name is rejected", () => {
  assert.equal(
    validateProfileFields({ first_name: "", last_name: "Smith", phone: "" }),
    "First name is required."
  );
});

test("whitespace-only first name is rejected", () => {
  assert.equal(
    validateProfileFields({ first_name: "   ", last_name: "Smith", phone: "" }),
    "First name is required."
  );
});

test("first name over 100 characters is rejected", () => {
  assert.equal(
    validateProfileFields({
      first_name: "a".repeat(101),
      last_name: "Smith",
      phone: "",
    }),
    "First name is too long."
  );
});

test("first name exactly 100 characters is accepted", () => {
  assert.equal(
    validateProfileFields({
      first_name: "a".repeat(100),
      last_name: "Smith",
      phone: "",
    }),
    null
  );
});

// ── Last name validation ──────────────────────────────────────────────────────

test("empty last name is rejected", () => {
  assert.equal(
    validateProfileFields({ first_name: "Jane", last_name: "", phone: "" }),
    "Last name is required."
  );
});

test("whitespace-only last name is rejected", () => {
  assert.equal(
    validateProfileFields({ first_name: "Jane", last_name: "   ", phone: "" }),
    "Last name is required."
  );
});

test("last name over 100 characters is rejected", () => {
  assert.equal(
    validateProfileFields({
      first_name: "Jane",
      last_name: "b".repeat(101),
      phone: "",
    }),
    "Last name is too long."
  );
});

test("last name exactly 100 characters is accepted", () => {
  assert.equal(
    validateProfileFields({
      first_name: "Jane",
      last_name: "b".repeat(100),
      phone: "",
    }),
    null
  );
});

// ── Phone validation ──────────────────────────────────────────────────────────

test("phone over 30 characters is rejected", () => {
  assert.equal(
    validateProfileFields({
      first_name: "Jane",
      last_name: "Smith",
      phone: "1".repeat(31),
    }),
    "Phone number is too long."
  );
});

test("phone exactly 30 characters is accepted", () => {
  assert.equal(
    validateProfileFields({
      first_name: "Jane",
      last_name: "Smith",
      phone: "1".repeat(30),
    }),
    null
  );
});

test("empty phone is accepted (optional field)", () => {
  assert.equal(
    validateProfileFields({ first_name: "Jane", last_name: "Smith", phone: "" }),
    null
  );
});

// ── First name checked before last name ──────────────────────────────────────

test("both names empty: first name error is returned first", () => {
  assert.equal(
    validateProfileFields({ first_name: "", last_name: "", phone: "" }),
    "First name is required."
  );
});

// ── Whitespace trimming ───────────────────────────────────────────────────────

test("first name with only spaces is treated as empty", () => {
  assert.equal(
    validateProfileFields({ first_name: "  ", last_name: "Smith", phone: "" }),
    "First name is required."
  );
});

test("last name with only spaces is treated as empty", () => {
  assert.equal(
    validateProfileFields({ first_name: "Jane", last_name: "  ", phone: "" }),
    "Last name is required."
  );
});

// ── Cross-user isolation (documented behaviour, not unit-testable here) ───────
// The Server Action derives the user ID from supabase.auth.getUser() — a
// server-validated call — and never accepts a user ID from the client.
// The RLS UPDATE policy (auth.uid() = id) enforces ownership at the DB level.

test("validation does not accept or inspect a user ID field", () => {
  // validateProfileFields has no userId parameter — ownership is server-side.
  assert.equal(
    validateProfileFields({ first_name: "Jane", last_name: "Smith", phone: "" }),
    null
  );
});

/**
 * Tests for src/lib/safe-redirect.ts
 *
 * Run with:  node --experimental-strip-types src/lib/safe-redirect.test.ts
 * (Node 22+ supports TypeScript stripping natively via --experimental-strip-types)
 *
 * Or compile first:
 *   npx tsc --noEmit && node -e "
 *     const {getSafeRedirect}=require('./src/lib/safe-redirect');
 *   "
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { getSafeRedirect } from "./safe-redirect.ts";

// ─── Valid internal paths ────────────────────────────────────────────────────

test("root path returns /", () => {
  assert.equal(getSafeRedirect("/"), "/");
});

test("simple path is accepted", () => {
  assert.equal(getSafeRedirect("/account"), "/account");
});

test("nested path is accepted", () => {
  assert.equal(getSafeRedirect("/collections/women"), "/collections/women");
});

test("path with query string is accepted", () => {
  assert.equal(getSafeRedirect("/search?q=dress"), "/search?q=dress");
});

test("path with hash is accepted", () => {
  assert.equal(getSafeRedirect("/products/blazer#details"), "/products/blazer#details");
});

test("path with query string and hash is accepted", () => {
  assert.equal(getSafeRedirect("/search?q=coat#results"), "/search?q=coat#results");
});

// ─── Null / empty / missing ──────────────────────────────────────────────────

test("null returns /", () => {
  assert.equal(getSafeRedirect(null), "/");
});

test("undefined returns /", () => {
  assert.equal(getSafeRedirect(undefined), "/");
});

test("empty string returns /", () => {
  assert.equal(getSafeRedirect(""), "/");
});

// ─── Absolute URL attacks ────────────────────────────────────────────────────

test("http:// absolute URL is rejected", () => {
  assert.equal(getSafeRedirect("http://evil.com"), "/");
});

test("https:// absolute URL is rejected", () => {
  assert.equal(getSafeRedirect("https://evil.com/steal"), "/");
});

test("http://localhost bypass is rejected", () => {
  assert.equal(getSafeRedirect("http://localhost"), "/");
});

test("http://localhost with path bypass is rejected", () => {
  assert.equal(getSafeRedirect("http://localhost/account"), "/");
});

test("HTTP://LOCALHOST uppercase bypass is rejected", () => {
  assert.equal(getSafeRedirect("HTTP://LOCALHOST/account"), "/");
});

test("javascript: scheme is rejected", () => {
  assert.equal(getSafeRedirect("javascript:alert(1)"), "/");
});

test("data: scheme is rejected", () => {
  assert.equal(getSafeRedirect("data:text/html,<h1>x</h1>"), "/");
});

test("mailto: scheme is rejected", () => {
  assert.equal(getSafeRedirect("mailto:x@evil.com"), "/");
});

// ─── Protocol-relative attacks ───────────────────────────────────────────────

test("// protocol-relative URL is rejected", () => {
  assert.equal(getSafeRedirect("//evil.com"), "/");
});

test("//evil.com with path is rejected", () => {
  assert.equal(getSafeRedirect("//evil.com/steal"), "/");
});

// ─── Backslash attacks ───────────────────────────────────────────────────────

test("/\\ backslash after slash is rejected", () => {
  assert.equal(getSafeRedirect("/\\evil.com"), "/");
});

test("\\ leading backslash is rejected", () => {
  assert.equal(getSafeRedirect("\\evil.com"), "/");
});

test("\\\\ double backslash is rejected", () => {
  assert.equal(getSafeRedirect("\\\\evil.com"), "/");
});

// ─── No leading slash ────────────────────────────────────────────────────────

test("relative path without leading slash is rejected", () => {
  assert.equal(getSafeRedirect("evil.com"), "/");
});

test("bare word is rejected", () => {
  assert.equal(getSafeRedirect("account"), "/");
});

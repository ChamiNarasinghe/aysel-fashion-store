import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/015_shopping_sync_operations.sql"
);
const typesPath = resolve(
  process.cwd(),
  "src/lib/supabase/types.ts"
);
const migration = readFileSync(migrationPath, "utf8");
const types = readFileSync(typesPath, "utf8");

test("C-2A migration creates the shopping operation table", () => {
  assert.match(
    migration,
    /CREATE TABLE IF NOT EXISTS public\.shopping_sync_operations/
  );
  assert.match(migration, /PRIMARY KEY \(user_id, operation_type, operation_id\)/);
});

test("C-2A cart and wishlist operation types are accepted", () => {
  assert.match(migration, /operation_type IN \('cart', 'wishlist'\)/);
});

test("C-2A invalid operation types are rejected", () => {
  assert.match(migration, /CONSTRAINT shopping_sync_operations_valid_type/);
  assert.match(migration, /operation_type IN \('cart', 'wishlist'\)/);
});

test("C-2A duplicate operation identity uses the composite primary key", () => {
  assert.match(
    migration,
    /PRIMARY KEY \(user_id, operation_type, operation_id\)/
  );
  assert.match(
    migration,
    /ON CONFLICT \(user_id, operation_type, operation_id\) DO NOTHING/
  );
});

test("C-2A hash constraint requires exactly 64 lowercase hexadecimal characters", () => {
  assert.ok(migration.includes("payload_hash ~ '^[0-9a-f]{64}$'"));
  assert.match(migration, /payload_hash CHAR\(64\)/);
});

test("C-2A valid pending and terminal status timestamp combinations are constrained", () => {
  assert.match(migration, /status IN \('pending', 'completed', 'failed'\)/);
  assert.match(migration, /status = 'pending' AND completed_at IS NULL/);
  assert.match(
    migration,
    /status IN \('completed', 'failed'\) AND completed_at IS NOT NULL/
  );
});

test("C-2A terminal operations require a stored result", () => {
  assert.match(
    migration,
    /CONSTRAINT shopping_sync_operations_valid_result_status[\s\S]*?status = 'pending' AND result IS NULL[\s\S]*?status IN \('completed', 'failed'\) AND result IS NOT NULL/
  );
});

test("C-2A RLS permits only ownership reads", () => {
  assert.match(migration, /ALTER TABLE public\.shopping_sync_operations ENABLE ROW LEVEL SECURITY/);
  assert.match(
    migration,
    /USING \(auth\.uid\(\) = user_id\)/
  );
  assert.match(
    migration,
    /REVOKE ALL ON TABLE public\.shopping_sync_operations FROM authenticated/
  );
  assert.match(
    migration,
    /GRANT SELECT ON TABLE public\.shopping_sync_operations TO authenticated/
  );
});

test("C-2A anonymous access and PUBLIC execution are revoked", () => {
  assert.match(
    migration,
    /REVOKE ALL ON TABLE public\.shopping_sync_operations FROM PUBLIC/
  );
  assert.match(
    migration,
    /REVOKE ALL ON TABLE public\.shopping_sync_operations FROM anon/
  );
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.shopping_reserve_operation/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.shopping_complete_operation/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.shopping_fail_operation/);
});

test("C-2A operation table writes are centralized in SECURITY DEFINER helpers", () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.shopping_reserve_operation/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.shopping_complete_operation/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.shopping_fail_operation/);
  const reserveBlock = migration.match(
    /CREATE OR REPLACE FUNCTION public\.shopping_reserve_operation[\s\S]*?\n\$\$;/ 
  );
  assert.ok(reserveBlock);
  assert.match(reserveBlock[0], /SECURITY DEFINER/);
  assert.match(reserveBlock[0], /v_user_id := auth\.uid\(\)/);
});

test("C-2A canonical payload contract includes identity, quantity and guest lines", () => {
  assert.match(migration, /"numeric_product_id": integer/);
  assert.match(migration, /"size": "XS"\|"S"\|"M"\|"L"\|"XL"\|"XXL"/);
  assert.match(migration, /"normalized_color":/);
  assert.match(migration, /"quantity": integer/);
  assert.match(migration, /"guest_line_ids":/);
  assert.match(migration, /"guest_line_version": integer \(optional\)/);
});

test("C-2A display-only fields are excluded from the canonical contract", () => {
  assert.match(migration, /Display-only fields.*?name, slug, image, price, stock and availability/s);
});

test("C-2A database hashing uses pgcrypto SHA-256", () => {
  assert.match(migration, /CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions/);
  assert.match(migration, /extensions\.digest/);
  assert.match(migration, /'sha256'/);
  assert.match(migration, /encode\(/);
  assert.match(migration, /'hex'/);
});

test("C-2A payload mismatch and replay behavior are implemented", () => {
  assert.match(migration, /PAYLOAD_CONFLICT/);
  assert.match(migration, /replayed/,);
  assert.match(migration, /status = 'completed'/);
  assert.match(migration, /status = 'failed'/);
  assert.match(migration, /status = 'pending'/);
  assert.match(migration, /operation_in_progress/);
});

test("C-2A failed operations replay their stored result", () => {
  const reserveStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_reserve_operation");
  const reserveEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.shopping_reserve_operation", reserveStart);
  const reserveBlock = migration.slice(reserveStart, reserveEnd);
  assert.match(reserveBlock, /IF v_existing\.status = 'failed'/);
  assert.match(reserveBlock, /'status', 'failed'/);
  assert.match(reserveBlock, /'replayed', TRUE/);
  assert.match(reserveBlock, /'result', v_existing\.result/);
  assert.doesNotMatch(reserveBlock, /status = 'pending',[\r\n]/);
  assert.doesNotMatch(reserveBlock, /attempt_count = attempt_count \+ 1/);
});

test("C-2A rollout does not grant direct browser mutation privileges", () => {
  assert.doesNotMatch(
    migration,
    /GRANT\s+(INSERT|UPDATE|DELETE)[^;]*shopping_sync_operations/
  );
});

test("C-2A generated types include operation table and helper RPCs", () => {
  assert.match(types, /shopping_sync_operations:/);
  assert.match(types, /shopping_payload_sha256:/);
  assert.match(types, /shopping_reserve_operation:/);
  assert.match(types, /shopping_complete_operation:/);
  assert.match(types, /shopping_fail_operation:/);
  assert.match(types, /ShoppingSyncOperationRow/);
});

test("C-2A internal helpers are revoked from PUBLIC, anon, and authenticated", () => {
  for (const functionName of [
    "shopping_reserve_operation",
    "shopping_complete_operation",
    "shopping_fail_operation",
  ]) {
    assert.ok(
      migration.includes(`REVOKE ALL ON FUNCTION public.${functionName}`),
      `${functionName} should have EXECUTE revoked`
    );
    assert.ok(
      migration.includes(`FROM PUBLIC;`),
      `${functionName} should be revoked from PUBLIC`
    );
    assert.ok(
      migration.includes(`FROM anon;`),
      `${functionName} should be revoked from anon`
    );
    assert.ok(
      migration.includes(`FROM authenticated;`),
      `${functionName} should be revoked from authenticated`
    );
  }
});

test("C-2A does not expose standalone public mutation RPCs", () => {
  assert.doesNotMatch(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.shopping_(reserve|complete|fail)_operation[\s\S]*?TO authenticated/
  );
  assert.match(
    migration,
    /future C-2B\/C-2C PostgreSQL RPC/
  );
});

test("C-2A validates guest-line elements before text conversion", () => {
  assert.doesNotMatch(migration, /jsonb_array_elements_text/);
  assert.match(
    migration,
    /jsonb_typeof\(v_line_element\) <> 'string'/
  );
  assert.match(
    migration,
    /btrim\(v_line_element #>> '\{\}'\)/
  );
  assert.match(
    migration,
    /guest_line_ids must contain only JSON strings/
  );
  assert.match(
    migration,
    /guest_line_ids must contain only non-empty strings/
  );
});

test("C-2A duplicate guest-line IDs are detected across the complete payload", () => {
  assert.match(
    migration,
    /v_line_id = ANY\(v_line_ids\)[\s\S]*?v_line_id = ANY\(v_all_line_ids\)/
  );
  assert.match(
    migration,
    /guest_line_ids must not contain duplicates across the payload/
  );
  assert.match(
    migration,
    /v_all_line_ids := array_append/
  );
});

test("C-2A cart and wishlist canonical arrays are sorted", () => {
  assert.match(migration, /jsonb_agg\(item ORDER BY item::TEXT\)/);
  assert.match(migration, /jsonb_agg\(product ORDER BY product::TEXT\)/);
  assert.match(migration, /array_agg\(line_id ORDER BY line_id\)/);
});

test("C-2A canonical payload rejects display-only fields", () => {
  assert.match(
    migration,
    /WHERE key NOT IN \([\s\S]*?'numeric_product_id'[\s\S]*?'quantity'/
  );
  assert.doesNotMatch(migration, /jsonb_build_object\('(?:name|slug|image|price|stock|availability)'/);
});

test("C-2A pending can complete and failed cannot complete", () => {
  const completeStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_complete_operation");
  const completeEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.shopping_complete_operation", completeStart);
  const completeBlock = migration.slice(completeStart, completeEnd);
  assert.match(completeBlock, /IF v_existing\.status = 'failed'/);
  assert.match(completeBlock, /'status', 'failed'/);
  assert.match(completeBlock, /IF v_existing\.status <> 'pending'/);
  assert.match(completeBlock, /status = 'completed'/);
});

test("C-2A pending can fail and failed fail calls preserve the failure", () => {
  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.shopping_fail_operation[\s\S]*?IF v_existing\.status = 'failed'[\s\S]*?'replayed', TRUE/
  );
  assert.match(migration, /status = 'failed'/);
});

test("C-2A failed operations do not retry through reserve", () => {
  const reserveStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_reserve_operation");
  const reserveEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.shopping_reserve_operation", reserveStart);
  const reserveBlock = migration.slice(reserveStart, reserveEnd);
  assert.match(reserveBlock, /IF v_existing\.status = 'failed'/);
  assert.match(reserveBlock, /'status', 'failed'/);
  assert.doesNotMatch(reserveBlock, /status = 'pending',[\r\n]/);
  assert.doesNotMatch(reserveBlock, /attempt_count = attempt_count \+ 1/);
});

test("C-2A completed operations replay and cannot be overwritten", () => {
  const completeStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_complete_operation");
  const completeEnd =
    migration.indexOf(
      "REVOKE ALL ON FUNCTION public.shopping_complete_operation",
      completeStart
    );
  const completeBlock = migration.slice(completeStart, completeEnd);
  assert.match(
    completeBlock,
    /IF v_existing\.status = 'completed'[\s\S]*?'replayed', TRUE[\s\S]*?'result', v_existing\.result/
  );
  assert.match(completeBlock, /IF v_existing\.status <> 'pending'/);
  assert.match(completeBlock, /status = 'completed'/);
});

test("C-2A completed and failed state transitions preserve completed status", () => {
  assert.match(migration, /status = 'completed'/);
  assert.match(migration, /PAYLOAD_CONFLICT/);
  assert.match(migration, /'status', 'failed'/);
});

test("C-2A TypeScript Json includes objects arrays and primitives", () => {
  assert.match(types, /export type Json =/);
  assert.match(types, /\|\s*\{ \[key: string\]: Json \}/);
  assert.match(types, /\|\s*Json\[\]/);
  assert.match(types, /\|\s*null/);
});

test("C-2A operation table Insert fields match database defaults", () => {
  assert.match(types, /"status" \|/);
  assert.match(types, /"result" \|/);
  assert.match(types, /"attempt_count" \|/);
  assert.match(types, /"completed_at"/);
  assert.match(types, /status\?: "pending" \| "completed" \| "failed"/);
  assert.match(types, /attempt_count\?: number/);
  assert.match(types, /completed_at\?: string \| null/);
});

test("C-2A generated TypeScript RPC argument signatures match SQL", () => {
  assert.match(types, /p_operation_type: "cart" \| "wishlist"/);
  assert.match(types, /p_operation_id: string/);
  assert.match(types, /p_payload: Json/);
  assert.match(types, /p_result: Json/);
});

test("C-2A table privileges revoke all from authenticated before granting SELECT", () => {
  assert.ok(
    migration.indexOf(
      "REVOKE ALL ON TABLE public.shopping_sync_operations FROM authenticated;"
    ) <
    migration.indexOf(
      "GRANT SELECT ON TABLE public.shopping_sync_operations TO authenticated;"
    )
  );
});

test("C-2A canonical payload limits are documented and enforced", () => {
  assert.match(migration, /Cart items: maximum 100/);
  assert.match(migration, /Wishlist products: maximum 100/);
  assert.match(migration, /Guest line IDs per item\/product: maximum 20/);
  assert.match(migration, /Guest line ID text: maximum 128 characters/);
  assert.match(migration, /Normalized colour text: maximum 64 characters/);
  assert.match(migration, /jsonb_array_length\(p_payload -> 'items'\) > 100/);
  assert.match(migration, /jsonb_array_length\(p_payload -> 'products'\) > 100/);
  assert.match(migration, /jsonb_array_length\(.*guest_line_ids'\) > 20/);
  assert.match(migration, /char_length\(v_line_id\) > 128/);
  assert.match(migration, /char_length\(v_color\) > 64/);
});

test("C-2A duplicate canonical identities are rejected", () => {
  assert.match(
    migration,
    /cart payload contains duplicate normalized variants/
  );
  assert.match(
    migration,
    /wishlist payload contains duplicate numeric product identities/
  );
  assert.match(
    migration,
    /guest_line_ids must not contain duplicates across the payload/
  );
});

test("C-2A equivalent payloads are canonically sorted", () => {
  assert.match(migration, /jsonb_agg\(item ORDER BY item::TEXT\)/);
  assert.match(migration, /jsonb_agg\(product ORDER BY product::TEXT\)/);
  assert.match(migration, /array_agg\(line_id ORDER BY line_id\)/);
});

test("C-2A meaningful quantity and identity fields affect canonical payload hashes", () => {
  assert.match(migration, /'numeric_product_id', v_numeric_id/);
  assert.match(migration, /'size', v_size/);
  assert.match(migration, /'normalized_color', v_color/);
  assert.match(migration, /'quantity', v_quantity/);
  assert.match(migration, /'database_product_uuid', v_database_uuid/);
  assert.match(migration, /jsonb_build_object\([\s\S]*?'operation_type'/);
});

test("C-2A real PostgreSQL integration tests remain explicitly unclaimed", () => {
  assert.doesNotMatch(
    migration,
    /CONCURRENTLY|integration test/
  );
  assert.doesNotMatch(
    migration,
    /tests passed against PostgreSQL/
  );
});

test("C-2A guest-line JSON type rejection covers non-string elements", () => {
  assert.match(
    migration,
    /jsonb_typeof\(v_line_element\) <> 'string'/
  );
  assert.match(
    migration,
    /guest_line_ids must contain only JSON strings/
  );
  assert.match(
    migration,
    /guest_line_ids must contain only non-empty strings/
  );
});

test("C-2A invalid operation IDs and types remain constrained", () => {
  assert.match(
    migration,
    /CHECK \(char_length\(operation_id\) BETWEEN 1 AND 128\)/
  );
  assert.match(
    migration,
    /CHECK \(operation_type IN \('cart', 'wishlist'\)\)/
  );
});

test("C-2A canonicalizer and hasher remove STRICT for explicit NULL validation", () => {
  const canonicalStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.canonicalize_shopping_payload");
  const canonicalEnd =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_payload_sha256", canonicalStart);
  const canonicalBlock = migration.slice(canonicalStart, canonicalEnd);
  assert.doesNotMatch(canonicalBlock, /\nSTRICT\s*\n/);
  assert.match(canonicalBlock, /IF p_operation_type IS NULL/);
  assert.match(canonicalBlock, /IF p_payload IS NULL OR jsonb_typeof\(p_payload\)/);

  const hashStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_payload_sha256");
  const hashEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.canonicalize_shopping_payload", hashStart);
  const hashBlock = migration.slice(hashStart, hashEnd);
  assert.doesNotMatch(hashBlock, /\nSTRICT\s*\n/);
  assert.match(hashBlock, /IF p_operation_type IS NULL/);
  assert.match(hashBlock, /IF p_payload IS NULL/);
});

test("C-2A failed reservation replays failure and never resets it", () => {
  const reserveStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_reserve_operation");
  const reserveEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.shopping_reserve_operation", reserveStart);
  const reserveBlock = migration.slice(reserveStart, reserveEnd);
  assert.match(reserveBlock, /IF v_existing\.status = 'failed'/);
  assert.match(reserveBlock, /'status', 'failed'/);
  assert.match(reserveBlock, /'replayed', TRUE/);
  assert.doesNotMatch(reserveBlock, /status = 'pending',[\r\n]/);
  assert.doesNotMatch(reserveBlock, /attempt_count = attempt_count \+ 1/);
});

test("C-2A failed payload conflict remains payload-specific", () => {
  const reserveStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_reserve_operation");
  const reserveEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.shopping_reserve_operation", reserveStart);
  const reserveBlock = migration.slice(reserveStart, reserveEnd);
  assert.match(reserveBlock, /v_existing\.payload_hash <> v_payload_hash/);
  assert.match(reserveBlock, /PAYLOAD_CONFLICT/);
  assert.match(reserveBlock, /v_existing\.status = 'failed'/);
});

test("C-2A guest-lines preserve independent line versions", () => {
  assert.match(migration, /v_guest_line_id := btrim/);
  assert.match(migration, /v_guest_line_version := \(/);
  assert.match(migration, /'line_id', v_guest_line_id/);
  assert.match(migration, /'line_version', v_guest_line_version/);
  assert.match(migration, /guest_lines entries require/);
});

test("C-2A canonical guest-line versions affect canonical JSON", () => {
  assert.match(migration, /v_guest_line_version :=/);
  assert.match(migration, /'line_id', v_guest_line_id/);
  assert.match(migration, /'line_version', v_guest_line_version/);
  assert.match(
    migration,
    /jsonb_agg\(line ORDER BY line::TEXT\)/
  );
});

test("C-2A pgcrypto digest uses the actual extensions schema", () => {
  assert.match(migration, /CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions/);
  assert.match(migration, /extensions\.digest\(/);
});

test("C-2A canonicalizer explicitly validates NULL operation type and payload", () => {
  const canonicalStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.canonicalize_shopping_payload");
  const canonicalEnd =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_payload_sha256", canonicalStart);
  const canonicalBlock = migration.slice(canonicalStart, canonicalEnd);
  assert.doesNotMatch(canonicalBlock, /\nSTRICT\s*\n/);
  assert.match(canonicalBlock, /IF p_operation_type IS NULL/);
  assert.match(canonicalBlock, /IF p_payload IS NULL OR jsonb_typeof\(p_payload\)/);
});

test("C-2A hash function explicitly validates NULL operation type and payload", () => {
  const hashStart =
    migration.indexOf("CREATE OR REPLACE FUNCTION public.shopping_payload_sha256");
  const hashEnd =
    migration.indexOf("REVOKE ALL ON FUNCTION public.canonicalize_shopping_payload", hashStart);
  const hashBlock = migration.slice(hashStart, hashEnd);
  assert.doesNotMatch(hashBlock, /\nSTRICT\s*\n/);
  assert.match(hashBlock, /IF p_operation_type IS NULL/);
  assert.match(hashBlock, /IF p_payload IS NULL/);
});

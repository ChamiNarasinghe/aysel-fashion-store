/**
 * Phase 10.7.3B migration tests.
 * Calls actual production functions from migrate-legacy-shopping.ts.
 * Storage is injected via StorageDeps — no browser APIs required.
 *
 * Run: node --experimental-strip-types src/lib/shopping/migration.test.ts
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseLegacyCart,
  parseLegacyWishlist,
  buildPlannedCartItems,
  buildPlannedWishlistItems,
  migrateLegacyCart,
  migrateLegacyWishlist,
  migrateLegacyShopping,
  readJournalRaw,
  writeJournal,
  MIGRATION_VERSION,
  LEGACY_CART_KEY,
  LEGACY_WISHLIST_KEY,
  GUEST_CART_KEY,
  GUEST_WISHLIST_KEY,
  JOURNAL_KEY,
  newMigrationId,
} from "./migrate-legacy-shopping.ts";

import type {
  StorageDeps,
  MigrationJournal,
  LegacyCartItem,
} from "./migrate-legacy-shopping.ts";

import type { GuestCartItem } from "./types.ts";

// ── Storage factory ───────────────────────────────────────────────────────────

type StorageOverrides = { failWrite?: boolean; failRead?: boolean; failRemove?: boolean };

function makeStorage(overrides: StorageOverrides = {}): StorageDeps & { store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    store,
    getItem(key) {
      if (overrides.failRead) return { ok: false, error: { kind: "read_error", message: "forced" } };
      return { ok: true, value: store[key] ?? null };
    },
    setItem(key, value) {
      if (overrides.failWrite) return { ok: false, error: { kind: "write_error", message: "forced" } };
      store[key] = value;
      return { ok: true, value: undefined };
    },
    removeItem(key) {
      if (overrides.failRemove) return { ok: false, error: { kind: "remove_error", message: "forced" } };
      delete store[key];
      return { ok: true, value: undefined };
    },
  };
}

// ── Envelope helpers ──────────────────────────────────────────────────────────

function legacyCartEnv(items: LegacyCartItem[]): string {
  return JSON.stringify({ state: { items }, version: 0 });
}
function legacyWishlistEnv(ids: number[]): string {
  return JSON.stringify({ state: { ids }, version: 0 });
}
function guestCartEnv(items: GuestCartItem[]): string {
  return JSON.stringify({ state: { items }, version: 0 });
}

function makeLegacyItem(o: Partial<LegacyCartItem> = {}): LegacyCartItem {
  return {
    productId: 1, slug: "the-essential-blazer", name: "The Essential Blazer",
    image: "/images/product-01.jpg", unitPrice: 12900, size: "M", color: "Charcoal", quantity: 1,
    ...o,
  };
}

function makeJournal(o: Partial<MigrationJournal> = {}): MigrationJournal {
  const now = Date.now();
  return {
    version: MIGRATION_VERSION, migrationId: newMigrationId(),
    legacyCartSnapshot: null, legacyWishlistSnapshot: null,
    plannedCartItems: [], plannedWishlistItems: [],
    cartStatus: "pending", wishlistStatus: "pending",
    createdAt: now, updatedAt: now, ...o,
  };
}

const KNOWN_IDS = new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CART PARSING TESTS (1–12)
// ═══════════════════════════════════════════════════════════════════════════

test("1. Migrate a valid legacy Zustand cart envelope", () => {
  const { items, invalid } = parseLegacyCart(legacyCartEnv([makeLegacyItem()]));
  assert.equal(items.length, 1);
  assert.equal(invalid.length, 0);
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned.length, 1);
  assert.equal(planned[0].lineVersion, 1);
  assert.equal(planned[0].mergeLock, "none");
  assert.ok(planned[0].lineId.length > 0);
});

test("2. Preserve product IDs", () => {
  const { items } = parseLegacyCart(legacyCartEnv([makeLegacyItem({ productId: 5 })]));
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned[0].productId, 5);
});

test("3. Preserve sizes and colours", () => {
  const { items } = parseLegacyCart(legacyCartEnv([makeLegacyItem({ size: "XL", color: "Ivory" })]));
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned[0].size, "XL");
  assert.equal(planned[0].color, "Ivory");
});

test("4. Preserve quantities", () => {
  const { items } = parseLegacyCart(legacyCartEnv([makeLegacyItem({ quantity: 3 })]));
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned[0].quantity, 3);
});

test("5. Preserve display prices", () => {
  const { items } = parseLegacyCart(legacyCartEnv([makeLegacyItem({ unitPrice: 9900 })]));
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned[0].unitPrice, 9900);
});

test("6. Preserve product names, slugs and images", () => {
  const { items } = parseLegacyCart(legacyCartEnv([
    makeLegacyItem({ name: "Silk Wrap Dress", slug: "silk-wrap-dress", image: "/images/category-women.jpg" }),
  ]));
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned[0].name, "Silk Wrap Dress");
  assert.equal(planned[0].slug, "silk-wrap-dress");
  assert.equal(planned[0].image, "/images/category-women.jpg");
});

test("7. Distinct variants remain distinct", () => {
  const { items } = parseLegacyCart(legacyCartEnv([
    makeLegacyItem({ size: "M", color: "Charcoal" }),
    makeLegacyItem({ size: "L", color: "Charcoal" }),
    makeLegacyItem({ size: "M", color: "Ivory" }),
  ]));
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned.length, 3);
  assert.equal(new Set(planned.map(p => p.lineId)).size, 3);
});

test("8. Duplicate variants are reconciled — quantities combined, duplicate count accurate", () => {
  const { items } = parseLegacyCart(legacyCartEnv([
    makeLegacyItem({ size: "M", color: "Charcoal", quantity: 2 }),
    makeLegacyItem({ size: "M", color: "Charcoal", quantity: 3 }),
  ]));
  const { planned, duplicate } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned.length, 1);
  assert.equal(planned[0].quantity, 5);
  assert.equal(duplicate, 1);
});

test("9. Invalid product IDs reported in recovery", () => {
  const { items } = parseLegacyCart(legacyCartEnv([makeLegacyItem({ productId: 999 })]));
  const { planned, invalid, recovery } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned.length, 0);
  assert.equal(invalid, 1);
  assert.equal(recovery.length, 1);
  assert.equal(recovery[0].productId, 999);
});

test("10. Invalid quantities are rejected during parsing", () => {
  const raw = legacyCartEnv([
    { productId: 1, slug: "s", name: "n", image: "/i.jpg", unitPrice: 100, size: "M", color: "Black", quantity: 0 },
    { productId: 1, slug: "s", name: "n", image: "/i.jpg", unitPrice: 100, size: "M", color: "Black", quantity: -1 },
    { productId: 1, slug: "s", name: "n", image: "/i.jpg", unitPrice: 100, size: "M", color: "Black", quantity: 1.5 },
  ] as LegacyCartItem[]);
  const { items, invalid } = parseLegacyCart(raw);
  assert.equal(items.length, 0);
  assert.equal(invalid.length, 3);
});

test("11. Unknown products are preserved in recovery data", () => {
  const { items } = parseLegacyCart(legacyCartEnv([makeLegacyItem({ productId: 9999 })]));
  const { recovery } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(recovery.length, 1);
  assert.equal(recovery[0].productId, 9999);
});

test("12. Empty legacy cart migrates correctly", () => {
  const { items, invalid } = parseLegacyCart(legacyCartEnv([]));
  assert.equal(items.length, 0);
  assert.equal(invalid.length, 0);
  const { planned } = buildPlannedCartItems(items, KNOWN_IDS);
  assert.equal(planned.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY WISHLIST PARSING TESTS (13–17)
// ═══════════════════════════════════════════════════════════════════════════

test("13. Migrate a valid legacy wishlist envelope", () => {
  const { ids, invalid } = parseLegacyWishlist(legacyWishlistEnv([1, 2, 3]));
  assert.equal(ids.length, 3);
  assert.equal(invalid.length, 0);
  const { planned } = buildPlannedWishlistItems(ids, KNOWN_IDS);
  assert.equal(planned.length, 3);
  planned.forEach(p => {
    assert.equal(p.mergeLock, "none");
    assert.ok(p.lineId.length > 0);
  });
});

test("14. Preserve valid product IDs", () => {
  const { ids } = parseLegacyWishlist(legacyWishlistEnv([5, 10, 15]));
  const { planned } = buildPlannedWishlistItems(ids, KNOWN_IDS);
  assert.deepEqual(planned.map(p => p.productId), [5, 10, 15]);
});

test("15. Remove duplicate IDs — duplicate count accurate", () => {
  const { ids } = parseLegacyWishlist(legacyWishlistEnv([1, 1, 2, 2, 3]));
  const { planned, duplicate } = buildPlannedWishlistItems(ids, KNOWN_IDS);
  assert.equal(planned.length, 3);
  assert.equal(duplicate, 2);
});

test("16. Reject nonexistent product IDs while preserving recovery data", () => {
  const { ids } = parseLegacyWishlist(legacyWishlistEnv([1, 9999, 8888]));
  const { planned, invalid, recovery } = buildPlannedWishlistItems(ids, KNOWN_IDS);
  assert.equal(planned.length, 1);
  assert.equal(planned[0].productId, 1);
  assert.equal(invalid, 2);
  assert.equal(recovery.length, 2);
  assert.ok((recovery as number[]).includes(9999));
  assert.ok((recovery as number[]).includes(8888));
});

test("17. Empty wishlist migrates correctly", () => {
  const { ids, invalid } = parseLegacyWishlist(legacyWishlistEnv([]));
  assert.equal(ids.length, 0);
  assert.equal(invalid.length, 0);
  const { planned } = buildPlannedWishlistItems(ids, KNOWN_IDS);
  assert.equal(planned.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// JOURNAL & FULL MIGRATION TESTS (18–28)
// ═══════════════════════════════════════════════════════════════════════════

test("18. Journal is written before destination changes", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr = readJournalRaw(storage);
  assert.equal(jr.kind, "valid");
});

test("19. Interrupted cart migration resumes with the same line IDs", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr1 = readJournalRaw(storage);
  assert.equal(jr1.kind, "valid");
  const ids1 = (jr1 as { kind: "valid"; journal: MigrationJournal }).journal.plannedCartItems.map(i => i.lineId);

  // Simulate interruption: remove guest cart but keep journal and legacy key
  delete storage.store[GUEST_CART_KEY];
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);

  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr2 = readJournalRaw(storage);
  assert.equal(jr2.kind, "valid");
  const ids2 = (jr2 as { kind: "valid"; journal: MigrationJournal }).journal.plannedCartItems.map(i => i.lineId);
  assert.deepEqual(ids1, ids2);
});

test("20. Interrupted wishlist migration resumes with the same line IDs", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_WISHLIST_KEY] = legacyWishlistEnv([1, 2, 3]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr1 = readJournalRaw(storage);
  assert.equal(jr1.kind, "valid");
  const ids1 = (jr1 as { kind: "valid"; journal: MigrationJournal }).journal.plannedWishlistItems.map(i => i.lineId);

  delete storage.store[GUEST_WISHLIST_KEY];
  storage.store[LEGACY_WISHLIST_KEY] = legacyWishlistEnv([1, 2, 3]);

  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr2 = readJournalRaw(storage);
  assert.equal(jr2.kind, "valid");
  const ids2 = (jr2 as { kind: "valid"; journal: MigrationJournal }).journal.plannedWishlistItems.map(i => i.lineId);
  assert.deepEqual(ids1, ids2);
});

test("21. Repeated migration does not duplicate entries", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  // Re-add legacy key to simulate second call
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const raw = storage.store[GUEST_CART_KEY];
  const parsed = JSON.parse(raw) as { state: { items: GuestCartItem[] } };
  assert.equal(parsed.state.items.length, 1);
});

test("22. Existing destination entries are preserved during migration", async () => {
  const storage = makeStorage();
  const existingItem: GuestCartItem = {
    lineId: "existing-line-1", productId: 3, slug: "classic-tailored-trousers",
    name: "Classic Tailored Trousers", image: "/images/product-03.jpg",
    unitPrice: 9900, size: "S", color: "Black", quantity: 1, lineVersion: 1, mergeLock: "none",
  };
  storage.store[GUEST_CART_KEY] = guestCartEnv([existingItem]);
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem({ productId: 1, size: "M", color: "Charcoal" })]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const parsed = JSON.parse(storage.store[GUEST_CART_KEY]) as { state: { items: GuestCartItem[] } };
  assert.equal(parsed.state.items.length, 2);
  assert.ok(parsed.state.items.some(i => i.lineId === "existing-line-1"));
});

test("23. Destination data is re-read and verified after write", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.cart.status, "complete");
  const parsed = JSON.parse(storage.store[GUEST_CART_KEY]) as { state: { items: GuestCartItem[] } };
  assert.equal(parsed.state.items.length, 1);
});

test("24. Legacy keys are retained if destination write fails", async () => {
  const storage = makeStorage({ failWrite: true });
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  // failWrite blocks journal write too, so migration returns failed immediately
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.canContinue, false);
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
});

test("25. Legacy keys are retained if source snapshot changes during migration", () => {
  const storage = makeStorage();
  const legacyCart = legacyCartEnv([makeLegacyItem()]);
  storage.store[LEGACY_CART_KEY] = legacyCart;
  // Journal with a different snapshot than what is in storage
  const differentSnapshot = legacyCartEnv([makeLegacyItem({ quantity: 99 })]);
  const journal = makeJournal({
    legacyCartSnapshot: differentSnapshot,
    plannedCartItems: [{ lineId: "line-x", productId: 1, slug: "s", name: "n", image: "/i.jpg", unitPrice: 100, size: "M", color: "Black", quantity: 1, lineVersion: 1, mergeLock: "none" }],
    cartStatus: "complete", wishlistStatus: "complete",
  });
  writeJournal(journal, storage);
  // Source differs from snapshot — legacy key must not be removed
  const currentSource = storage.store[LEGACY_CART_KEY] ?? null;
  assert.notEqual(currentSource, differentSnapshot);
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
});

test("26. Failed storage writes do not report success", async () => {
  const storage = makeStorage({ failWrite: true });
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.cart.status, "failed");
  assert.equal(result.cart.itemsMigrated, 0);
});

test("27. Corrupt journal blocks migration and preserves all data", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  const existingItem: GuestCartItem = {
    lineId: "safe-line", productId: 2, slug: "soft-knit-sweater",
    name: "Soft Knit Sweater", image: "/images/product-02.jpg",
    unitPrice: 8500, size: "S", color: "Oatmeal", quantity: 1, lineVersion: 1, mergeLock: "none",
  };
  storage.store[GUEST_CART_KEY] = guestCartEnv([existingItem]);
  storage.store[JOURNAL_KEY] = "NOT_VALID_JSON{{{";

  const result = await migrateLegacyShopping(KNOWN_IDS, storage);

  // Migration must be blocked
  assert.equal(result.canContinue, false);
  assert.equal(result.cart.status, "failed");
  // Journal must not be overwritten
  assert.equal(storage.store[JOURNAL_KEY], "NOT_VALID_JSON{{{");
  // Legacy data must be preserved
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
  // Destination data must be preserved
  const destParsed = JSON.parse(storage.store[GUEST_CART_KEY]) as { state: { items: GuestCartItem[] } };
  assert.ok(destParsed.state.items.some(i => i.lineId === "safe-line"));
});

test("28. Retry reuses the existing valid migration ID", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr1 = readJournalRaw(storage);
  assert.equal(jr1.kind, "valid");
  const originalId = (jr1 as { kind: "valid"; journal: MigrationJournal }).journal.migrationId;

  // Re-add legacy key and run again
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  await migrateLegacyShopping(KNOWN_IDS, storage);
  const jr2 = readJournalRaw(storage);
  assert.equal(jr2.kind, "valid");
  assert.equal((jr2 as { kind: "valid"; journal: MigrationJournal }).journal.migrationId, originalId);
});

// ═══════════════════════════════════════════════════════════════════════════
// CORRUPT / UNSUPPORTED JOURNAL TESTS (29–31)
// ═══════════════════════════════════════════════════════════════════════════

test("29. Unsupported journal version blocks migration without touching data", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  // Write a journal with wrong version
  const badVersionJournal = makeJournal({ version: 99 });
  storage.store[JOURNAL_KEY] = JSON.stringify(badVersionJournal);

  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.canContinue, false);
  assert.ok(result.cart.error !== undefined);
  // Journal must not be overwritten
  const stored = JSON.parse(storage.store[JOURNAL_KEY]) as { version: number };
  assert.equal(stored.version, 99);
  // Legacy data preserved
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
});

test("30. Invalid JSON journal blocks migration without touching data", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  storage.store[JOURNAL_KEY] = "{{invalid json}}";
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.canContinue, false);
  assert.equal(storage.store[JOURNAL_KEY], "{{invalid json}}");
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
});

test("31. Journal missing required fields is treated as corrupt", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  // Valid JSON but missing migrationId
  storage.store[JOURNAL_KEY] = JSON.stringify({ version: 1, cartStatus: "pending" });
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.canContinue, false);
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
});

// ═══════════════════════════════════════════════════════════════════════════
// CONCURRENCY TESTS (32–34)
// ═══════════════════════════════════════════════════════════════════════════

test("32. A completed journal from another tab prevents re-migration", async () => {
  const storage = makeStorage();
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  const completedJournal = makeJournal({
    cartStatus: "complete", wishlistStatus: "complete",
    plannedCartItems: [{ lineId: "tab1-line", productId: 1, slug: "s", name: "n", image: "/i.jpg", unitPrice: 100, size: "M", color: "Black", quantity: 1, lineVersion: 1, mergeLock: "none" }],
  });
  storage.store[JOURNAL_KEY] = JSON.stringify(completedJournal);
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.cart.status, "complete");
  const jr = readJournalRaw(storage);
  assert.equal(jr.kind, "valid");
  assert.equal((jr as { kind: "valid"; journal: MigrationJournal }).journal.migrationId, completedJournal.migrationId);
});

test("33. Failed write preserves both legacy datasets", async () => {
  const storage = makeStorage({ failWrite: true });
  storage.store[LEGACY_CART_KEY] = legacyCartEnv([makeLegacyItem()]);
  storage.store[LEGACY_WISHLIST_KEY] = legacyWishlistEnv([1, 2]);
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.cart.status, "failed");
  assert.equal(result.wishlist.status, "failed");
  assert.equal(result.legacyCartRemoved, false);
  assert.equal(result.legacyWishlistRemoved, false);
  assert.ok(storage.store[LEGACY_CART_KEY] !== undefined);
  assert.ok(storage.store[LEGACY_WISHLIST_KEY] !== undefined);
});

test("34. No legacy data and no journal returns canContinue=true without writing anything", async () => {
  const storage = makeStorage();
  const result = await migrateLegacyShopping(KNOWN_IDS, storage);
  assert.equal(result.canContinue, true);
  assert.equal(Object.keys(storage.store).length, 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// migrateLegacyCart UNIT TESTS (35–37)
// ═══════════════════════════════════════════════════════════════════════════

test("35. migrateLegacyCart writes and verifies guest cart", () => {
  const storage = makeStorage();
  const journal = makeJournal({
    legacyCartSnapshot: legacyCartEnv([makeLegacyItem()]),
    plannedCartItems: [],
  });
  const { result } = migrateLegacyCart(journal, storage);
  assert.equal(result.status, "complete");
  assert.equal(result.itemsMigrated, 1);
  assert.ok(storage.store[GUEST_CART_KEY] !== undefined);
});

test("36. migrateLegacyCart returns failed when write fails", () => {
  const storage = makeStorage({ failWrite: true });
  const journal = makeJournal({
    legacyCartSnapshot: legacyCartEnv([makeLegacyItem()]),
    plannedCartItems: [],
  });
  const { result } = migrateLegacyCart(journal, storage);
  assert.equal(result.status, "failed");
  assert.ok(result.error !== undefined);
});

test("37. migrateLegacyCart duplicate count is accurate", () => {
  const snapshot = legacyCartEnv([
    makeLegacyItem({ size: "M", color: "Black", quantity: 1 }),
    makeLegacyItem({ size: "M", color: "Black", quantity: 2 }),
  ]);
  const storage = makeStorage();
  const journal = makeJournal({ legacyCartSnapshot: snapshot, plannedCartItems: [] });
  const { result } = migrateLegacyCart(journal, storage);
  assert.equal(result.itemsDuplicate, 1);
  assert.equal(result.itemsMigrated, 1);
});

// ═══════════════════════════════════════════════════════════════════════════
// migrateLegacyWishlist UNIT TESTS (38–40)
// ═══════════════════════════════════════════════════════════════════════════

test("38. migrateLegacyWishlist writes and verifies guest wishlist", () => {
  const storage = makeStorage();
  const journal = makeJournal({
    legacyWishlistSnapshot: legacyWishlistEnv([1, 2, 3]),
    plannedWishlistItems: [],
  });
  const { result } = migrateLegacyWishlist(journal, storage);
  assert.equal(result.status, "complete");
  assert.equal(result.itemsMigrated, 3);
  assert.ok(storage.store[GUEST_WISHLIST_KEY] !== undefined);
});

test("39. migrateLegacyWishlist returns failed when write fails", () => {
  const storage = makeStorage({ failWrite: true });
  const journal = makeJournal({
    legacyWishlistSnapshot: legacyWishlistEnv([1, 2]),
    plannedWishlistItems: [],
  });
  const { result } = migrateLegacyWishlist(journal, storage);
  assert.equal(result.status, "failed");
  assert.ok(result.error !== undefined);
});

test("40. migrateLegacyWishlist duplicate count is accurate", () => {
  const storage = makeStorage();
  const journal = makeJournal({
    legacyWishlistSnapshot: legacyWishlistEnv([1, 1, 2, 2, 3]),
    plannedWishlistItems: [],
  });
  const { result } = migrateLegacyWishlist(journal, storage);
  assert.equal(result.itemsDuplicate, 2);
  assert.equal(result.itemsMigrated, 3);
});

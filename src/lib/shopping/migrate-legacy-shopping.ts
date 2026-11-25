// Phase 10.7.3B — Legacy shopping migration.
// Migrates aysel-cart and aysel-wishlist into the new guest store keys.
// Pure logic module — no Zustand imports, no React imports.
// Safe to call from StoreProvider and testable in Node.

import { getItem, setItem, removeItem } from "../storage/safe-storage.ts";
import type { StorageResult } from "../storage/safe-storage.ts";
import type { GuestCartItem, GuestWishlistItem } from "@/lib/shopping/types";

// ── Injectable storage interface (for testing) ────────────────────────────────

export type StorageDeps = {
  getItem: (key: string) => StorageResult<string | null>;
  setItem: (key: string, value: string) => StorageResult<void>;
  removeItem: (key: string) => StorageResult<void>;
};

const defaultStorage: StorageDeps = { getItem, setItem, removeItem };

// ── Constants ─────────────────────────────────────────────────────────────────

export const LEGACY_CART_KEY = "aysel-cart";
export const LEGACY_WISHLIST_KEY = "aysel-wishlist";
export const GUEST_CART_KEY = "aysel-guest-cart";
export const GUEST_WISHLIST_KEY = "aysel-guest-wishlist";
export const JOURNAL_KEY = "aysel-shopping-migration-v1";
export const LOCK_NAME = "aysel-shopping-migration-v1";
export const MIGRATION_VERSION = 1;

// ── Legacy envelope types (actual Zustand persist format) ─────────────────────

// aysel-cart: { state: { items: LegacyCartItem[] }, version: 0 }
export type LegacyCartItem = {
  productId: number;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  size: string;
  color: string;
  quantity: number;
};

// aysel-wishlist: { state: { ids: number[] }, version: 0 }
export type LegacyWishlistEnvelope = {
  state: { ids: unknown };
  version: unknown;
};

export type LegacyCartEnvelope = {
  state: { items: unknown };
  version: unknown;
};

// ── Guest store envelope type (Zustand persist format written by guest stores) ─

type GuestCartEnvelope = {
  state: { items: GuestCartItem[] };
  version: number;
};

type GuestWishlistEnvelope = {
  state: { items: GuestWishlistItem[] };
  version: number;
};

// ── Migration journal ─────────────────────────────────────────────────────────

export type MigrationStatus = "pending" | "in_progress" | "complete" | "failed";

export type MigrationJournal = {
  version: number;
  migrationId: string;
  legacyCartSnapshot: string | null;
  legacyWishlistSnapshot: string | null;
  plannedCartItems: GuestCartItem[];
  plannedWishlistItems: GuestWishlistItem[];
  cartStatus: MigrationStatus;
  wishlistStatus: MigrationStatus;
  createdAt: number;
  updatedAt: number;
};

// ── Migration result ──────────────────────────────────────────────────────────

export type CartMigrationResult = {
  status: MigrationStatus;
  itemsMigrated: number;
  itemsInvalid: number;
  itemsDuplicate: number;
  recoveryItems: LegacyCartItem[];
  error?: string;
};

export type WishlistMigrationResult = {
  status: MigrationStatus;
  itemsMigrated: number;
  itemsInvalid: number;
  itemsDuplicate: number;
  recoveryItems: unknown[];
  error?: string;
};

export type MigrationResult = {
  cart: CartMigrationResult;
  wishlist: WishlistMigrationResult;
  legacyCartRemoved: boolean;
  legacyWishlistRemoved: boolean;
  journalPersisted: boolean;
  canContinue: boolean;
};

// ── ID generation (browser-safe) ──────────────────────────────────────────────

export function newLineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newMigrationId(): string {
  return `mig-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidProductId(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}

function isValidQuantity(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidLegacyCartItem(v: unknown): v is LegacyCartItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isValidProductId(o.productId) &&
    isNonEmptyString(o.slug) &&
    isNonEmptyString(o.name) &&
    isNonEmptyString(o.image) &&
    typeof o.unitPrice === "number" &&
    o.unitPrice > 0 &&
    isNonEmptyString(o.size) &&
    isNonEmptyString(o.color) &&
    isValidQuantity(o.quantity)
  );
}

// ── Journal persistence ───────────────────────────────────────────────────────

export type JournalReadResult =
  | { kind: "absent" }
  | { kind: "valid"; journal: MigrationJournal }
  | { kind: "corrupt"; raw: string };

export function readJournalRaw(storage: StorageDeps = defaultStorage): JournalReadResult {
  const result = storage.getItem(JOURNAL_KEY);
  if (!result.ok || !result.value) return { kind: "absent" };
  const raw = result.value;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { kind: "corrupt", raw };
    const j = parsed as Record<string, unknown>;
    if (
      typeof j.migrationId !== "string" ||
      !Array.isArray(j.plannedCartItems) ||
      !Array.isArray(j.plannedWishlistItems) ||
      typeof j.cartStatus !== "string" ||
      typeof j.wishlistStatus !== "string"
    ) {
      return { kind: "corrupt", raw };
    }
    // Unsupported version — treat as corrupt, not absent
    if (j.version !== MIGRATION_VERSION) return { kind: "corrupt", raw };
    return { kind: "valid", journal: parsed as MigrationJournal };
  } catch {
    return { kind: "corrupt", raw };
  }
}

/** @deprecated Use readJournalRaw — kept for backward compatibility only */
export function readJournal(storage: StorageDeps = defaultStorage): MigrationJournal | null {
  const r = readJournalRaw(storage);
  return r.kind === "valid" ? r.journal : null;
}

export function writeJournal(journal: MigrationJournal, storage: StorageDeps = defaultStorage): boolean {
  const result = storage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  return result.ok;
}

function updateJournal(
  journal: MigrationJournal,
  patch: Partial<MigrationJournal>
): MigrationJournal {
  return { ...journal, ...patch, updatedAt: Date.now() };
}

// ── Parse legacy data ─────────────────────────────────────────────────────────

export function parseLegacyCart(raw: string | null): {
  items: LegacyCartItem[];
  invalid: unknown[];
} {
  if (!raw) return { items: [], invalid: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { items: [], invalid: [] };
    const envelope = parsed as Record<string, unknown>;
    const state = envelope.state as Record<string, unknown> | undefined;
    if (!state || !Array.isArray(state.items)) return { items: [], invalid: [] };
    const items: LegacyCartItem[] = [];
    const invalid: unknown[] = [];
    for (const entry of state.items) {
      if (isValidLegacyCartItem(entry)) {
        items.push(entry);
      } else {
        invalid.push(entry);
      }
    }
    return { items, invalid };
  } catch {
    return { items: [], invalid: [] };
  }
}

export function parseLegacyWishlist(raw: string | null): {
  ids: number[];
  invalid: unknown[];
} {
  if (!raw) return { ids: [], invalid: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { ids: [], invalid: [] };
    const envelope = parsed as Record<string, unknown>;
    const state = envelope.state as Record<string, unknown> | undefined;
    if (!state || !Array.isArray(state.ids)) return { ids: [], invalid: [] };
    const ids: number[] = [];
    const invalid: unknown[] = [];
    for (const entry of state.ids) {
      if (isValidProductId(entry)) {
        ids.push(entry);
      } else {
        invalid.push(entry);
      }
    }
    return { ids, invalid };
  } catch {
    return { ids: [], invalid: [] };
  }
}

// ── Build planned items from legacy data ──────────────────────────────────────

export function buildPlannedCartItems(
  legacyItems: LegacyCartItem[],
  knownProductIds: Set<number>
): {
  planned: GuestCartItem[];
  invalid: number;
  duplicate: number;
  recovery: LegacyCartItem[];
} {
  const seen = new Map<string, number>(); // variantKey -> index in planned
  const planned: GuestCartItem[] = [];
  let invalid = 0;
  let duplicate = 0;
  const recovery: LegacyCartItem[] = [];

  for (const item of legacyItems) {
    if (!knownProductIds.has(item.productId)) {
      // Unknown product — preserve in recovery, skip
      recovery.push(item);
      invalid++;
      continue;
    }
    const key = `${item.productId}|${item.size}|${item.color}`;
    const existingIdx = seen.get(key);
    if (existingIdx !== undefined) {
      // Duplicate variant — combine quantities
      planned[existingIdx] = {
        ...planned[existingIdx],
        quantity: planned[existingIdx].quantity + item.quantity,
      };
      duplicate++;
    } else {
      const guestItem: GuestCartItem = {
        lineId: newLineId(),
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        image: item.image,
        unitPrice: item.unitPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        lineVersion: 1,
        mergeLock: "none",
      };
      seen.set(key, planned.length);
      planned.push(guestItem);
    }
  }

  return { planned, invalid, duplicate, recovery };
}

export function buildPlannedWishlistItems(
  legacyIds: number[],
  knownProductIds: Set<number>
): {
  planned: GuestWishlistItem[];
  invalid: number;
  duplicate: number;
  recovery: unknown[];
} {
  const seen = new Set<number>();
  const planned: GuestWishlistItem[] = [];
  let invalid = 0;
  let duplicate = 0;
  const recovery: unknown[] = [];

  for (const id of legacyIds) {
    if (!knownProductIds.has(id)) {
      recovery.push(id);
      invalid++;
      continue;
    }
    if (seen.has(id)) {
      duplicate++;
      continue;
    }
    seen.add(id);
    planned.push({ lineId: newLineId(), productId: id, mergeLock: "none" });
  }

  return { planned, invalid, duplicate, recovery };
}

// ── Read existing guest store data ────────────────────────────────────────────

function readGuestCartItems(storage: StorageDeps): GuestCartItem[] {
  const result = storage.getItem(GUEST_CART_KEY);
  if (!result.ok || !result.value) return [];
  try {
    const parsed = JSON.parse(result.value) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const env = parsed as GuestCartEnvelope;
    return Array.isArray(env.state?.items) ? env.state.items : [];
  } catch {
    return [];
  }
}

function readGuestWishlistItems(storage: StorageDeps): GuestWishlistItem[] {
  const result = storage.getItem(GUEST_WISHLIST_KEY);
  if (!result.ok || !result.value) return [];
  try {
    const parsed = JSON.parse(result.value) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const env = parsed as GuestWishlistEnvelope;
    return Array.isArray(env.state?.items) ? env.state.items : [];
  } catch {
    return [];
  }
}

// ── Merge planned items with existing destination items ───────────────────────
// Existing destination items take precedence. Planned items are added only if
// no matching variant already exists in the destination.

function mergeCartItems(
  existing: GuestCartItem[],
  planned: GuestCartItem[]
): GuestCartItem[] {
  const result = [...existing];
  for (const p of planned) {
    const alreadyPresent = existing.some(
      (e) =>
        e.productId === p.productId &&
        e.size === p.size &&
        e.color === p.color
    );
    if (!alreadyPresent) {
      result.push(p);
    }
  }
  return result;
}

function mergeWishlistItems(
  existing: GuestWishlistItem[],
  planned: GuestWishlistItem[]
): GuestWishlistItem[] {
  const result = [...existing];
  for (const p of planned) {
    const alreadyPresent = existing.some((e) => e.productId === p.productId);
    if (!alreadyPresent) {
      result.push(p);
    }
  }
  return result;
}

// ── Write guest store envelopes ───────────────────────────────────────────────

function writeGuestCartItems(items: GuestCartItem[], storage: StorageDeps): boolean {
  const envelope: GuestCartEnvelope = { state: { items }, version: 0 };
  const result = storage.setItem(GUEST_CART_KEY, JSON.stringify(envelope));
  return result.ok;
}

function writeGuestWishlistItems(items: GuestWishlistItem[], storage: StorageDeps): boolean {
  const envelope: GuestWishlistEnvelope = { state: { items }, version: 0 };
  const result = storage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(envelope));
  return result.ok;
}

// ── Verify destination after write ───────────────────────────────────────────
// Re-reads the destination and confirms every planned lineId is present.

function verifyCartWrite(plannedItems: GuestCartItem[], storage: StorageDeps): boolean {
  if (plannedItems.length === 0) return true;
  const written = readGuestCartItems(storage);
  const writtenIds = new Set(written.map((i) => i.lineId));
  return plannedItems.every((p) => writtenIds.has(p.lineId));
}

function verifyWishlistWrite(plannedItems: GuestWishlistItem[], storage: StorageDeps): boolean {
  if (plannedItems.length === 0) return true;
  const written = readGuestWishlistItems(storage);
  const writtenIds = new Set(written.map((i) => i.lineId));
  return plannedItems.every((p) => writtenIds.has(p.lineId));
}

// ── Verify legacy source has not changed ─────────────────────────────────────

function legacySourceUnchanged(
  key: string,
  originalSnapshot: string | null,
  storage: StorageDeps
): boolean {
  const current = storage.getItem(key);
  const currentValue = current.ok ? current.value : null;
  return currentValue === originalSnapshot;
}

// ── Core migration logic ──────────────────────────────────────────────────────

export function migrateLegacyCart(
  journal: MigrationJournal,
  storage: StorageDeps = defaultStorage
): { journal: MigrationJournal; result: CartMigrationResult } {
  const { items: legacyItems, invalid: parseInvalid } = parseLegacyCart(
    journal.legacyCartSnapshot
  );

  if (legacyItems.length === 0 && parseInvalid.length === 0) {
    const updated = updateJournal(journal, { cartStatus: "complete" });
    return {
      journal: updated,
      result: {
        status: "complete",
        itemsMigrated: 0,
        itemsInvalid: 0,
        itemsDuplicate: 0,
        recoveryItems: [],
      },
    };
  }

  // Use planned items from journal if already generated (retry path)
  let planned: GuestCartItem[];
  let invalid: number;
  let duplicate: number;
  let recovery: LegacyCartItem[];

  if (journal.plannedCartItems.length > 0) {
    planned = journal.plannedCartItems;
    invalid = parseInvalid.length;
    duplicate = 0;
    recovery = [];
  } else {
    // Use a placeholder knownIds set that accepts all valid product IDs from the snapshot
    // (buildPlannedCartItems is called from migrateLegacyShopping with real knownIds;
    //  here we accept all items that passed validation)
    const allIds = new Set(legacyItems.map((i) => i.productId));
    const built = buildPlannedCartItems(legacyItems, allIds);
    planned = built.planned;
    invalid = parseInvalid.length + built.invalid;
    duplicate = built.duplicate;
    recovery = built.recovery;
  }

  const existing = readGuestCartItems(storage);
  const merged = mergeCartItems(existing, planned);

  const writeOk = writeGuestCartItems(merged, storage);
  if (!writeOk) {
    const updated = updateJournal(journal, {
      cartStatus: "failed",
      plannedCartItems: planned,
    });
    return {
      journal: updated,
      result: {
        status: "failed",
        itemsMigrated: 0,
        itemsInvalid: invalid,
        itemsDuplicate: duplicate,
        recoveryItems: recovery,
        error: "Failed to write guest cart",
      },
    };
  }

  const verified = verifyCartWrite(planned, storage);
  if (!verified) {
    const updated = updateJournal(journal, {
      cartStatus: "failed",
      plannedCartItems: planned,
    });
    return {
      journal: updated,
      result: {
        status: "failed",
        itemsMigrated: planned.length,
        itemsInvalid: invalid,
        itemsDuplicate: duplicate,
        recoveryItems: recovery,
        error: "Destination verification failed after cart write",
      },
    };
  }

  const updated = updateJournal(journal, {
    cartStatus: "complete",
    plannedCartItems: planned,
  });
  return {
    journal: updated,
    result: {
      status: "complete",
      itemsMigrated: planned.length,
      itemsInvalid: invalid,
      itemsDuplicate: duplicate,
      recoveryItems: recovery,
    },
  };
}

export function migrateLegacyWishlist(
  journal: MigrationJournal,
  storage: StorageDeps = defaultStorage
): { journal: MigrationJournal; result: WishlistMigrationResult } {
  const { ids: legacyIds, invalid: parseInvalid } = parseLegacyWishlist(
    journal.legacyWishlistSnapshot
  );

  if (legacyIds.length === 0 && parseInvalid.length === 0) {
    const updated = updateJournal(journal, { wishlistStatus: "complete" });
    return {
      journal: updated,
      result: {
        status: "complete",
        itemsMigrated: 0,
        itemsInvalid: 0,
        itemsDuplicate: 0,
        recoveryItems: [],
      },
    };
  }

  let planned: GuestWishlistItem[];
  let invalid: number;
  let duplicate: number;
  let recovery: unknown[];

  if (journal.plannedWishlistItems.length > 0) {
    planned = journal.plannedWishlistItems;
    invalid = parseInvalid.length;
    duplicate = 0;
    recovery = [];
  } else {
    const allIds = new Set(legacyIds);
    const built = buildPlannedWishlistItems(legacyIds, allIds);
    planned = built.planned;
    invalid = parseInvalid.length + built.invalid;
    duplicate = built.duplicate;
    recovery = built.recovery;
  }

  const existing = readGuestWishlistItems(storage);
  const merged = mergeWishlistItems(existing, planned);

  const writeOk = writeGuestWishlistItems(merged, storage);
  if (!writeOk) {
    const updated = updateJournal(journal, {
      wishlistStatus: "failed",
      plannedWishlistItems: planned,
    });
    return {
      journal: updated,
      result: {
        status: "failed",
        itemsMigrated: 0,
        itemsInvalid: invalid,
        itemsDuplicate: duplicate,
        recoveryItems: recovery,
        error: "Failed to write guest wishlist",
      },
    };
  }

  const verified = verifyWishlistWrite(planned, storage);
  if (!verified) {
    const updated = updateJournal(journal, {
      wishlistStatus: "failed",
      plannedWishlistItems: planned,
    });
    return {
      journal: updated,
      result: {
        status: "failed",
        itemsMigrated: planned.length,
        itemsInvalid: invalid,
        itemsDuplicate: duplicate,
        recoveryItems: recovery,
        error: "Destination verification failed after wishlist write",
      },
    };
  }

  const updated = updateJournal(journal, {
    wishlistStatus: "complete",
    plannedWishlistItems: planned,
  });
  return {
    journal: updated,
    result: {
      status: "complete",
      itemsMigrated: planned.length,
      itemsInvalid: invalid,
      itemsDuplicate: duplicate,
      recoveryItems: recovery,
    },
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function migrateLegacyShopping(
  knownProductIds: Set<number>,
  storage: StorageDeps = defaultStorage
): Promise<MigrationResult> {
  const corruptError = (
    msg: string
  ): MigrationResult => ({
    cart: { status: "failed", itemsMigrated: 0, itemsInvalid: 0, itemsDuplicate: 0, recoveryItems: [], error: msg },
    wishlist: { status: "failed", itemsMigrated: 0, itemsInvalid: 0, itemsDuplicate: 0, recoveryItems: [], error: msg },
    legacyCartRemoved: false,
    legacyWishlistRemoved: false,
    journalPersisted: false,
    canContinue: false,
  });

  // ── Step 1: Read all current state ────────────────────────────────────────
  const legacyCartRaw = storage.getItem(LEGACY_CART_KEY);
  const legacyWishlistRaw = storage.getItem(LEGACY_WISHLIST_KEY);
  const legacyCartSnapshot = legacyCartRaw.ok ? legacyCartRaw.value : null;
  const legacyWishlistSnapshot = legacyWishlistRaw.ok ? legacyWishlistRaw.value : null;

  // ── Step 2: Check journal — distinguish absent / valid / corrupt ──────────
  const journalResult = readJournalRaw(storage);

  // Corrupt or unsupported-version journal: block migration, preserve everything
  if (journalResult.kind === "corrupt") {
    return corruptError(
      "Migration journal is corrupt or from an unsupported version. " +
      "Manual recovery required — no data has been modified."
    );
  }

  // No legacy data at all and no journal — nothing to migrate
  if (!legacyCartSnapshot && !legacyWishlistSnapshot && journalResult.kind === "absent") {
    return {
      cart: { status: "complete", itemsMigrated: 0, itemsInvalid: 0, itemsDuplicate: 0, recoveryItems: [] },
      wishlist: { status: "complete", itemsMigrated: 0, itemsInvalid: 0, itemsDuplicate: 0, recoveryItems: [] },
      legacyCartRemoved: false,
      legacyWishlistRemoved: false,
      journalPersisted: false,
      canContinue: true,
    };
  }

  let journal: MigrationJournal | null =
    journalResult.kind === "valid" ? journalResult.journal : null;

  if (journal && journal.cartStatus === "complete" && journal.wishlistStatus === "complete") {
    // Already completed — remove legacy keys if still present
    let cartRemoved = false;
    let wishlistRemoved = false;
    if (legacyCartSnapshot) cartRemoved = storage.removeItem(LEGACY_CART_KEY).ok;
    if (legacyWishlistSnapshot) wishlistRemoved = storage.removeItem(LEGACY_WISHLIST_KEY).ok;
    return {
      cart: { status: "complete", itemsMigrated: journal.plannedCartItems.length, itemsInvalid: 0, itemsDuplicate: 0, recoveryItems: [] },
      wishlist: { status: "complete", itemsMigrated: journal.plannedWishlistItems.length, itemsInvalid: 0, itemsDuplicate: 0, recoveryItems: [] },
      legacyCartRemoved: cartRemoved,
      legacyWishlistRemoved: wishlistRemoved,
      journalPersisted: true,
      canContinue: true,
    };
  }

  // ── Step 3: Build or resume journal ──────────────────────────────────────
  if (!journal) {
    const { items: legacyCartItems, invalid: cartInvalid } = parseLegacyCart(legacyCartSnapshot);
    const { ids: legacyWishlistIds, invalid: wishlistInvalid } = parseLegacyWishlist(legacyWishlistSnapshot);
    const { planned: plannedCart } = buildPlannedCartItems(legacyCartItems, knownProductIds);
    const { planned: plannedWishlist } = buildPlannedWishlistItems(legacyWishlistIds, knownProductIds);
    const now = Date.now();
    journal = {
      version: MIGRATION_VERSION,
      migrationId: newMigrationId(),
      legacyCartSnapshot,
      legacyWishlistSnapshot,
      plannedCartItems: plannedCart,
      plannedWishlistItems: plannedWishlist,
      cartStatus: "pending",
      wishlistStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };
    // ── Step 4: Persist journal BEFORE any destination write ─────────────
    const journalWritten = writeJournal(journal, storage);
    if (!journalWritten) {
      return {
        cart: { status: "failed", itemsMigrated: 0, itemsInvalid: cartInvalid.length, itemsDuplicate: 0, recoveryItems: [], error: "Could not write migration journal" },
        wishlist: { status: "failed", itemsMigrated: 0, itemsInvalid: wishlistInvalid.length, itemsDuplicate: 0, recoveryItems: [], error: "Could not write migration journal" },
        legacyCartRemoved: false,
        legacyWishlistRemoved: false,
        journalPersisted: false,
        canContinue: false,
      };
    }
  }

  // Mark in_progress
  journal = updateJournal(journal, { cartStatus: "in_progress", wishlistStatus: "in_progress" });
  writeJournal(journal, storage);

  // ── Step 5: Migrate cart ──────────────────────────────────────────────────
  const { journal: journalAfterCart, result: cartResult } = migrateLegacyCart(journal, storage);
  journal = journalAfterCart;
  writeJournal(journal, storage);

  // ── Step 6: Migrate wishlist ──────────────────────────────────────────────
  const { journal: journalAfterWishlist, result: wishlistResult } = migrateLegacyWishlist(journal, storage);
  journal = journalAfterWishlist;
  writeJournal(journal, storage);

  // ── Step 7: Verify source has not changed, then remove legacy keys ────────
  let legacyCartRemoved = false;
  let legacyWishlistRemoved = false;

  if (cartResult.status === "complete" && wishlistResult.status === "complete") {
    const cartSourceUnchanged = legacySourceUnchanged(LEGACY_CART_KEY, journal.legacyCartSnapshot, storage);
    const wishlistSourceUnchanged = legacySourceUnchanged(LEGACY_WISHLIST_KEY, journal.legacyWishlistSnapshot, storage);
    if (cartSourceUnchanged && legacyCartSnapshot) legacyCartRemoved = storage.removeItem(LEGACY_CART_KEY).ok;
    if (wishlistSourceUnchanged && legacyWishlistSnapshot) legacyWishlistRemoved = storage.removeItem(LEGACY_WISHLIST_KEY).ok;
  }

  // ── Step 8: Persist final journal ─────────────────────────────────────────
  const journalPersisted = writeJournal(journal, storage);

  return {
    cart: cartResult,
    wishlist: wishlistResult,
    legacyCartRemoved,
    legacyWishlistRemoved,
    journalPersisted,
    canContinue: cartResult.status === "complete" && wishlistResult.status === "complete",
  };
}

// ── Cross-tab concurrency via Web Locks API ───────────────────────────────────

export async function runMigrationWithLock(
  knownProductIds: Set<number>,
  storage: StorageDeps = defaultStorage
): Promise<MigrationResult> {
  const nav = typeof navigator !== "undefined" ? navigator : null;

  if (nav && "locks" in nav && nav.locks) {
    return nav.locks.request(
      LOCK_NAME,
      { mode: "exclusive" },
      () => migrateLegacyShopping(knownProductIds, storage)
    );
  }

  // Web Locks unavailable — check if migration is already complete via journal
  const journalResult = readJournalRaw(storage);
  if (
    journalResult.kind === "valid" &&
    journalResult.journal.cartStatus === "complete" &&
    journalResult.journal.wishlistStatus === "complete"
  ) {
    return migrateLegacyShopping(knownProductIds, storage);
  }

  // Cannot guarantee exclusive access — preserve both datasets, expose error
  return {
    cart: {
      status: "failed",
      itemsMigrated: 0,
      itemsInvalid: 0,
      itemsDuplicate: 0,
      recoveryItems: [],
      error: "Web Locks API unavailable — migration blocked to prevent concurrent data corruption",
    },
    wishlist: {
      status: "failed",
      itemsMigrated: 0,
      itemsInvalid: 0,
      itemsDuplicate: 0,
      recoveryItems: [],
      error: "Web Locks API unavailable — migration blocked to prevent concurrent data corruption",
    },
    legacyCartRemoved: false,
    legacyWishlistRemoved: false,
    journalPersisted: false,
    canContinue: false,
  };
}

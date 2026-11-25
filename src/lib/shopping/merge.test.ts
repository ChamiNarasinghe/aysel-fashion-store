import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isCanonicalUuid,
  mergeGuestCartWithAccount,
  mergeGuestWishlistWithAccount,
} from "./merge-shopping.ts";
import type {
  AccountCartItem,
  AccountWishlistItem,
  GuestCartItem,
  GuestWishlistItem,
  ProductIdentityMap,
} from "./types.ts";

const UUID_1 = "11111111-1111-1111-1111-111111111111";
const UUID_2 = "22222222-2222-2222-2222-222222222222";
const UUID_ALT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const UUID_SHARED = "33333333-3333-3333-3333-333333333333";

const mappings: ProductIdentityMap[] = [
  { existingProductId: 1, productUuid: UUID_1 },
  { existingProductId: 2, productUuid: UUID_2 },
];

function guestCart(
  overrides: Partial<GuestCartItem> = {}
): GuestCartItem {
  return {
    lineId: "guest-line-1",
    productId: 1,
    slug: "the-essential-blazer",
    name: "The Essential Blazer",
    image: "/images/product-01.jpg",
    unitPrice: 12900,
    size: "M",
    color: "Charcoal",
    quantity: 1,
    lineVersion: 1,
    mergeLock: "none",
    ...overrides,
  };
}

function accountCart(
  overrides: Partial<AccountCartItem> = {}
): AccountCartItem {
  return {
    id: "account-line-1",
    cartId: "cart-1",
    variantId: "variant-1",
    productId: UUID_1,
    name: "The Essential Blazer",
    image: "/images/product-01.jpg",
    size: "M",
    color: "Charcoal",
    quantity: 2,
    serverPrice: 12900,
    ...overrides,
  };
}

function guestWishlist(
  overrides: Partial<GuestWishlistItem> = {}
): GuestWishlistItem {
  return {
    lineId: "guest-wish-1",
    productId: 1,
    mergeLock: "none",
    ...overrides,
  };
}

function accountWishlist(
  overrides: Partial<AccountWishlistItem> = {}
): AccountWishlistItem {
  return {
    id: "account-wish-1",
    productId: UUID_1,
    existingProductId: 1,
    name: "The Essential Blazer",
    image: "/images/product-01.jpg",
    ...overrides,
  };
}

test("cart merge 1: empty guest cart", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-1",
    guestItems: [],
    accountItems: [accountCart()],
    productIdentityMap: mappings,
  });
  assert.deepEqual(result.matched, []);
  assert.deepEqual(result.newItems, []);
  assert.deepEqual(result.conflicts, []);
});

test("cart merge 2: empty account cart", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-2",
    guestItems: [guestCart()],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 1);
  assert.equal(result.newItems[0].quantity, 1);
  assert.equal(result.newItems[0].guestLineIds[0], "guest-line-1");
});

test("cart merge 3: guest cart with a new variant", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-3",
    guestItems: [guestCart({ size: "XL", color: "Ivory" })],
    accountItems: [accountCart()],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 1);
  assert.equal(result.newItems[0].displaySize, "XL");
  assert.equal(result.newItems[0].displayColor, "Ivory");
  assert.equal(result.newItems[0].normalizedSize, "XL");
  assert.equal(result.newItems[0].normalizedColor, "ivory");
});

test("cart merge 4: matching guest variant adds quantity", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-4",
    guestItems: [guestCart({ quantity: 3 })],
    accountItems: [accountCart({ quantity: 2 })],
    productIdentityMap: mappings,
  });
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].mergedQuantity, 5);
});

test("cart merge 5: duplicate guest lines combine deterministically", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-5",
    guestItems: [
      guestCart({ lineId: "line-b", quantity: 2 }),
      guestCart({ lineId: "line-a", quantity: 3 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 1);
  assert.equal(result.newItems[0].quantity, 5);
  assert.deepEqual(result.newItems[0].guestLineIds, ["line-a", "line-b"]);
});

test("cart merge 6: different sizes remain separate", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-6",
    guestItems: [
      guestCart({ lineId: "size-m", size: "M" }),
      guestCart({ lineId: "size-l", size: "L" }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 2);
});

test("cart merge 7: different colours remain separate", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-7",
    guestItems: [
      guestCart({ lineId: "charcoal", color: "Charcoal" }),
      guestCart({ lineId: "ivory", color: "Ivory" }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 2);
});

test("cart merge 8: existing account identity is preserved", () => {
  const account = accountCart();
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-8",
    guestItems: [guestCart()],
    accountItems: [account],
    productIdentityMap: mappings,
  });
  assert.equal(result.matched[0].accountItem, account);
  assert.equal(result.matched[0].accountItem.id, "account-line-1");
});

test("cart merge 9: guest line IDs are preserved", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-9",
    guestItems: [guestCart({ lineId: "preserved-line" })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.deepEqual(result.newItems[0].guestLineIds, ["preserved-line"]);
});

test("cart merge 10: invalid product identity", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-10",
    guestItems: [guestCart({ lineId: "bad-product", productId: 0 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.conflicts.some((c) => c.code === "invalid_guest_product_id"), true);
});

test("cart merge 11: invalid colour or size", () => {
  const badSize = mergeGuestCartWithAccount({
    operationId: "cart-op-11a",
    guestItems: [guestCart({ lineId: "bad-size", size: "XXXL" })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  const badColor = mergeGuestCartWithAccount({
    operationId: "cart-op-11b",
    guestItems: [guestCart({ lineId: "bad-color", color: " " })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(badSize.conflicts.some((c) => c.code === "invalid_guest_size"), true);
  assert.equal(badColor.conflicts.some((c) => c.code === "invalid_guest_color"), true);
});

test("cart merge 12: zero or negative quantity", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-12",
    guestItems: [
      guestCart({ lineId: "zero", quantity: 0 }),
      guestCart({ lineId: "negative", quantity: -1 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.conflicts.filter((c) => c.code === "invalid_quantity").length, 2);
});

test("cart merge 13: non-integer quantity", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-13",
    guestItems: [guestCart({ quantity: 1.5 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.conflicts.some((c) => c.code === "invalid_quantity"), true);
});

test("cart merge 14: very large quantity is not truncated", () => {
  const quantity = Number.MAX_SAFE_INTEGER;
  const result = mergeGuestCartWithAccount({
    operationId: "cart-op-14",
    guestItems: [guestCart({ quantity })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems[0].quantity, quantity);
});

test("cart merge 15: identical inputs are deterministic", () => {
  const input = {
    operationId: "cart-op-15",
    guestItems: [guestCart({ lineId: "b" }), guestCart({ lineId: "a", quantity: 2 })],
    accountItems: [accountCart()],
    productIdentityMap: mappings,
  };
  const first = mergeGuestCartWithAccount(input);
  const second = mergeGuestCartWithAccount(input);
  assert.deepEqual(first, second);
});

test("cart merge 16: inputs are not mutated", () => {
  const guest = [guestCart({ quantity: 3 })];
  const account = [accountCart({ quantity: 2 })];
  const snapshot = JSON.stringify({ guest, account });
  mergeGuestCartWithAccount({
    operationId: "cart-op-16",
    guestItems: guest,
    accountItems: account,
    productIdentityMap: mappings,
  });
  assert.equal(JSON.stringify({ guest, account }), snapshot);
});

test("wishlist merge 1: empty guest wishlist", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-1",
    guestItems: [],
    accountItems: [accountWishlist()],
    productIdentityMap: mappings,
  });
  assert.deepEqual(result.existing, []);
  assert.deepEqual(result.insertRequired, []);
});

test("wishlist merge 2: empty account wishlist", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-2",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.insertRequired.length, 1);
});

test("wishlist merge 3: new guest product", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-3",
    guestItems: [guestWishlist({ productId: 2 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.insertRequired[0].productUuid, UUID_2);
});

test("wishlist merge 4: account already contains guest product", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-4",
    guestItems: [guestWishlist()],
    accountItems: [accountWishlist()],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing.length, 1);
  assert.equal(result.insertRequired.length, 0);
});

test("wishlist merge 5: duplicate guest products combine", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-5",
    guestItems: [
      guestWishlist({ lineId: "wish-b" }),
      guestWishlist({ lineId: "wish-a" }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.insertRequired.length, 1);
  assert.deepEqual(result.insertRequired[0].guestLineIds, ["wish-a", "wish-b"]);
});

test("wishlist merge 6: invalid guest product", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-6",
    guestItems: [guestWishlist({ lineId: "bad-wish", productId: -1 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.conflicts.some((c) => c.code === "invalid_guest_product_id"), true);
});

test("wishlist merge 7: account identity is preserved", () => {
  const account = accountWishlist();
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-7",
    guestItems: [guestWishlist()],
    accountItems: [account],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing[0].accountItem, account);
});

test("wishlist merge 8: guest line IDs are preserved", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-op-8",
    guestItems: [guestWishlist({ lineId: "preserved-wish" })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.deepEqual(result.insertRequired[0].guestLineIds, ["preserved-wish"]);
});

test("wishlist merge 9: identical inputs are deterministic", () => {
  const input = {
    operationId: "wish-op-9",
    guestItems: [guestWishlist({ lineId: "b", productId: 2 }), guestWishlist({ lineId: "a" })],
    accountItems: [accountWishlist()],
    productIdentityMap: mappings,
  };
  assert.deepEqual(
    mergeGuestWishlistWithAccount(input),
    mergeGuestWishlistWithAccount(input)
  );
});

test("wishlist merge 10: inputs are not mutated", () => {
  const guest = [guestWishlist()];
  const account = [accountWishlist()];
  const snapshot = JSON.stringify({ guest, account });
  mergeGuestWishlistWithAccount({
    operationId: "wish-op-10",
    guestItems: guest,
    accountItems: account,
    productIdentityMap: mappings,
  });
  assert.equal(JSON.stringify({ guest, account }), snapshot);
});

test("operation contract: stable operation ID and plan-only status", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "stable-operation-id",
    guestItems: [],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.operationId, "stable-operation-id");
  assert.equal(result.operationContract, "merge-plan-only");
  assert.equal(result.persistenceStatus, "not-attempted");
  assert.equal(result.databaseIdempotencyStatus, "not-established");
});

test("operation contract: structured validation failure for empty operation ID", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.operationId, "");
  assert.equal(result.conflicts.some((c) => c.code === "invalid_operation_id"), true);
  assert.equal(result.insertRequired.length, 0);
});

test("operation contract: no database IDs are generated", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "no-generated-ids",
    guestItems: [guestCart()],
    accountItems: [],
    productIdentityMap: [],
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "unmappable_guest_variant"), true);
});

test("cart regression: duplicate casing and whitespace share one normalized variant", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-casing",
    guestItems: [
      guestCart({ lineId: "line-z", size: " m ", color: "  CHARCOAL  ", quantity: 1 }),
      guestCart({ lineId: "line-a", size: "M", color: "Charcoal", quantity: 2 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 1);
  assert.equal(result.newItems[0].quantity, 3);
  assert.equal(result.newItems[0].normalizedSize, "M");
  assert.equal(result.newItems[0].normalizedColor, "charcoal");
  assert.equal(result.newItems[0].displaySize, "M");
  assert.equal(result.newItems[0].displayColor, "Charcoal");
  assert.deepEqual(result.newItems[0].guestLineIds, ["line-a", "line-z"]);
});

test("cart regression: duplicate quantity overflow blocks the whole variant", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-duplicate-overflow",
    guestItems: [
      guestCart({ lineId: "overflow-a", quantity: Number.MAX_SAFE_INTEGER }),
      guestCart({ lineId: "overflow-b", quantity: 1 }),
      guestCart({ lineId: "overflow-c", quantity: 1 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  const conflict = result.conflicts.find((c) => c.code === "quantity_overflow");
  assert.deepEqual(conflict?.guestLineIds, ["overflow-a", "overflow-b", "overflow-c"]);
});

test("cart regression: account plus guest overflow blocks the whole variant", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-account-overflow",
    guestItems: [guestCart({ lineId: "account-overflow", quantity: 1 })],
    accountItems: [accountCart({ quantity: Number.MAX_SAFE_INTEGER })],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "quantity_overflow"), true);
});

test("cart regression: unmapped numeric product produces no insert candidate", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-unmapped",
    guestItems: [guestCart({ lineId: "unmapped-line", productId: 999 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  const conflict = result.conflicts.find((c) => c.code === "unmappable_guest_variant");
  assert.equal(conflict?.numericProductId, 999);
  assert.deepEqual(conflict?.guestLineIds, ["unmapped-line"]);
});

test("cart regression: conflicting numeric-to-UUID mappings block affected candidates", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-conflict-numeric",
    guestItems: [guestCart({ lineId: "numeric-conflict", productId: 1 })],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: UUID_1 },
      { existingProductId: 1, productUuid: UUID_ALT },
    ],
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "invalid_product_mapping" && c.numericProductId === 1
  ), true);
});

test("cart regression: conflicting UUID-to-numeric mappings block affected candidates", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-conflict-uuid",
    guestItems: [guestCart({ lineId: "uuid-conflict", productId: 1 })],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: UUID_SHARED },
      { existingProductId: 2, productUuid: UUID_SHARED },
    ],
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "invalid_product_mapping" && c.databaseProductId === UUID_SHARED
  ), true);
});

test("cart regression: invalid account variant fields are reported", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-invalid-account",
    guestItems: [guestCart()],
    accountItems: [accountCart({ variantId: "", size: "INVALID", color: " " })],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_item"), true);
});

test("cart regression: invalid account quantities are reported", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-invalid-account-quantity",
    guestItems: [guestCart()],
    accountItems: [accountCart({ quantity: 0 })],
    productIdentityMap: mappings,
  });
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_quantity"), true);
});

test("cart regression: duplicate account variants are blocked", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-duplicate-account",
    guestItems: [guestCart()],
    accountItems: [
      accountCart({ id: "account-a", variantId: "variant-a" }),
      accountCart({ id: "account-b", variantId: "variant-b" }),
    ],
    productIdentityMap: mappings,
  });
  assert.equal(result.matched.length, 0);
  assert.equal(result.newItems.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "duplicate_account_variant"), true);
});

test("cart regression: duplicate and missing guest line IDs are reported", () => {
  const duplicateIdResult = mergeGuestCartWithAccount({
    operationId: "cart-duplicate-line",
    guestItems: [
      guestCart({ lineId: "same-line", quantity: 1 }),
      guestCart({ lineId: "same-line", quantity: 2 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(duplicateIdResult.conflicts.some((c) => c.code === "invalid_guest_line_id"), true);

  const missingIdResult = mergeGuestCartWithAccount({
    operationId: "cart-missing-line",
    guestItems: [guestCart({ lineId: "" })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(missingIdResult.newItems.length, 0);
  assert.equal(missingIdResult.conflicts.some((c) => c.code === "invalid_guest_line_id"), true);
});

test("cart regression: independent valid variants survive another blocked variant", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-independent",
    guestItems: [
      guestCart({ lineId: "bad", productId: 1, quantity: 0 }),
      guestCart({ lineId: "good", productId: 2, size: "L", color: "Navy", quantity: 2 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 1);
  assert.equal(result.newItems[0].guestProductId, 2);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_quantity"), true);
});

test("wishlist regression: unmapped product produces an explicit conflict", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-unmapped",
    guestItems: [guestWishlist({ lineId: "wish-unmapped", productId: 999 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "unmappable_guest_variant" && c.numericProductId === 999
  ), true);
});

test("wishlist regression: conflicting numeric-to-UUID mappings block products", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-conflict-numeric",
    guestItems: [guestWishlist({ productId: 1 })],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: UUID_1 },
      { existingProductId: 1, productUuid: UUID_ALT },
    ],
  });
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "invalid_product_mapping" && c.numericProductId === 1
  ), true);
});

test("wishlist regression: conflicting UUID-to-numeric mappings block products", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-conflict-uuid",
    guestItems: [guestWishlist({ productId: 1 })],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: UUID_SHARED },
      { existingProductId: 2, productUuid: UUID_SHARED },
    ],
  });
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "invalid_product_mapping" && c.databaseProductId === UUID_SHARED
  ), true);
});

test("wishlist regression: inconsistent account identity is reported", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-inconsistent",
    guestItems: [guestWishlist({ productId: 1 })],
    accountItems: [accountWishlist({ existingProductId: 1, productId: UUID_2 })],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing.length, 0);
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_item"), true);
});

test("wishlist regression: duplicate account numeric identities are blocked", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-duplicate-account",
    guestItems: [guestWishlist({ productId: 1 })],
    accountItems: [
      accountWishlist({ id: "wish-a", productId: UUID_1, existingProductId: 1 }),
      accountWishlist({ id: "wish-b", productId: UUID_ALT, existingProductId: 1 }),
    ],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing.length, 0);
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_item"), true);
});

test("wishlist regression: valid account identity is preserved", () => {
  const account = accountWishlist();
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-valid-account",
    guestItems: [guestWishlist({ lineId: "valid-wish-line" })],
    accountItems: [account],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing.length, 1);
  assert.equal(result.existing[0].accountItem, account);
  assert.deepEqual(result.existing[0].guestLineIds, ["valid-wish-line"]);
});

test("wishlist regression: a null numeric account ID uses its unique valid mapping", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-ambiguous",
    guestItems: [guestWishlist({ productId: 1 })],
    accountItems: [
      accountWishlist({ existingProductId: null, productId: ` ${UUID_1} ` }),
    ],
    productIdentityMap: [
      { existingProductId: 1, productUuid: ` ${UUID_1} ` },
    ],
  });
  assert.equal(result.existing.length, 1);
  assert.equal(result.insertRequired.length, 0);
});

test("mapping regression: behaviour is deterministic regardless of mapping order", () => {
  const forward = [
    { existingProductId: 1, productUuid: ` ${UUID_1} ` },
    { existingProductId: 2, productUuid: UUID_2 },
  ];
  const reverse = [...forward].reverse();
  const cartInput = {
    operationId: "mapping-order",
    guestItems: [guestCart()],
    accountItems: [],
  };
  const first = mergeGuestCartWithAccount({ ...cartInput, productIdentityMap: forward });
  const second = mergeGuestCartWithAccount({ ...cartInput, productIdentityMap: reverse });
  assert.deepEqual(first, second);
  assert.equal(first.newItems[0].databaseProductId, UUID_1);
});

test("mapping regression: conflicting mappings are deterministic regardless of order", () => {
  const forward = [
    { existingProductId: 1, productUuid: UUID_2 },
    { existingProductId: 1, productUuid: UUID_1 },
    { existingProductId: 2, productUuid: UUID_1 },
  ];
  const input = {
    operationId: "mapping-conflict-order",
    guestItems: [guestCart({ lineId: "mapped-one" }), guestCart({ lineId: "mapped-two", productId: 2 })],
    accountItems: [],
  };
  const first = mergeGuestCartWithAccount({ ...input, productIdentityMap: forward });
  const second = mergeGuestCartWithAccount({
    ...input,
    productIdentityMap: [...forward].reverse(),
  });
  assert.deepEqual(first, second);
  assert.equal(first.newItems.length, 0);
});

test("cart regression: blank mapping blocks a conflicting valid mapping", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-blank-mapping",
    guestItems: [guestCart()],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: "   " },
      { existingProductId: 1, productUuid: UUID_1 },
    ],
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "invalid_product_mapping" && c.numericProductId === 1
  ), true);
});

test("cart regression: duplicate guest line IDs block the whole variant", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-duplicate-line-id",
    guestItems: [
      guestCart({ lineId: "same-line", quantity: 1 }),
      guestCart({ lineId: "same-line", quantity: 2 }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_guest_line_id"), true);
});

test("cart regression: duplicate line IDs across variants block both variants", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-cross-variant-line-id",
    guestItems: [
      guestCart({ lineId: "reused-line", productId: 1 }),
      guestCart({ lineId: "reused-line", productId: 2, size: "L", color: "Navy" }),
    ],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.filter((c) => c.code === "invalid_guest_line_id").length, 2);
});

test("cart regression: an unsafe integer quantity is rejected", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "cart-unsafe-integer",
    guestItems: [guestCart({ quantity: Number.MAX_SAFE_INTEGER + 1 })],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_quantity"), true);
});

test("wishlist regression: conflicting mappings never produce insert candidates", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-ambiguous-mappings",
    guestItems: [guestWishlist({ productId: 1 })],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: UUID_1 },
      { existingProductId: 1, productUuid: UUID_2 },
    ],
  });
  assert.equal(result.existing.length, 0);
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_product_mapping"), true);
});

test("wishlist regression: duplicate account entries with one database UUID are blocked", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-duplicate-account-uuid",
    guestItems: [guestWishlist()],
    accountItems: [
      accountWishlist({ id: "wish-a" }),
      accountWishlist({ id: "wish-b" }),
    ],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing.length, 0);
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_item"), true);
});

test("operation contract: wishlist insert candidates explicitly permit insertion", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "wish-insert-permitted",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap: mappings,
  });
  assert.equal(result.insertRequired[0].productUuid, UUID_1);
  assert.equal(result.insertRequired[0].insertPermitted, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.insertRequired[0], "id"), false);
  assert.equal(result.persistenceStatus, "not-attempted");
  assert.equal(result.databaseIdempotencyStatus, "not-established");
});

test("mapping regression: merge functions do not mutate mapping inputs", () => {
  const productIdentityMap = [
    { existingProductId: 1, productUuid: ` ${UUID_1} ` },
    { existingProductId: 2, productUuid: UUID_2 },
  ];
  const snapshot = JSON.stringify(productIdentityMap);
  mergeGuestWishlistWithAccount({
    operationId: "mapping-immutable",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap,
  });
  assert.equal(JSON.stringify(productIdentityMap), snapshot);
});

test("uuid validation: valid lowercase UUID", () => {
  assert.equal(isCanonicalUuid("11111111-1111-1111-1111-111111111111"), true);
});

test("uuid validation: valid uppercase UUID", () => {
  assert.equal(isCanonicalUuid("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"), true);
});

test("uuid validation: malformed grouping is rejected", () => {
  assert.equal(isCanonicalUuid("1111111-1111-1111-1111-111111111111"), false);
});

test("uuid validation: non-hexadecimal characters are rejected", () => {
  assert.equal(isCanonicalUuid("11111111-1111-1111-1111-11111111111g"), false);
});

test("uuid validation: empty and whitespace-only values are rejected", () => {
  assert.equal(isCanonicalUuid(""), false);
  assert.equal(isCanonicalUuid("   "), false);
});

test("uuid regression: invalid numeric-to-UUID mapping is blocked", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "uuid-invalid-numeric-mapping",
    guestItems: [guestCart()],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: "11111111-1111-1111-1111-11111111111g" },
    ],
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) =>
    c.code === "invalid_product_mapping" && c.numericProductId === 1
  ), true);
});

test("uuid regression: invalid reverse mapping is blocked", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "uuid-invalid-reverse",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: "11111111-1111-1111-1111-11111111111z" },
    ],
  });
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_product_mapping"), true);
});

test("uuid regression: invalid account cart product ID is blocked", () => {
  const result = mergeGuestCartWithAccount({
    operationId: "uuid-invalid-account-cart",
    guestItems: [guestCart()],
    accountItems: [accountCart({ productId: "not-a-uuid" })],
    productIdentityMap: mappings,
  });
  assert.equal(result.newItems.length, 0);
  assert.equal(result.matched.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_item"), true);
});

test("uuid regression: invalid account wishlist product ID is blocked", () => {
  const result = mergeGuestWishlistWithAccount({
    operationId: "uuid-invalid-account-wishlist",
    guestItems: [guestWishlist()],
    accountItems: [accountWishlist({ productId: "not-a-uuid" })],
    productIdentityMap: mappings,
  });
  assert.equal(result.existing.length, 0);
  assert.equal(result.insertRequired.length, 0);
  assert.equal(result.conflicts.some((c) => c.code === "invalid_account_item"), true);
});

test("uuid regression: no candidate contains a malformed UUID", () => {
  const cart = mergeGuestCartWithAccount({
    operationId: "uuid-candidate-cart",
    guestItems: [guestCart()],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: "malformed" },
    ],
  });
  const wishlist = mergeGuestWishlistWithAccount({
    operationId: "uuid-candidate-wishlist",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap: [
      { existingProductId: 1, productUuid: "malformed" },
    ],
  });
  assert.equal(cart.newItems.length, 0);
  assert.equal(cart.matched.length, 0);
  assert.equal(wishlist.insertRequired.length, 0);
  assert.equal(wishlist.existing.length, 0);
});

test("uuid regression: valid lowercase and uppercase mappings remain usable", () => {
  const lowercase = mergeGuestCartWithAccount({
    operationId: "uuid-valid-lower",
    guestItems: [guestCart()],
    accountItems: [],
    productIdentityMap: [{ existingProductId: 1, productUuid: UUID_1 }],
  });
  const uppercase = mergeGuestWishlistWithAccount({
    operationId: "uuid-valid-upper",
    guestItems: [guestWishlist()],
    accountItems: [],
    productIdentityMap: [{
      existingProductId: 1,
      productUuid: "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
    }],
  });
  assert.equal(lowercase.newItems[0].databaseProductId, UUID_1);
  assert.equal(
    uppercase.insertRequired[0].productUuid,
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
  );
});

test("uuid regression: invalid mapping conflicts remain deterministic by input order", () => {
  const forward = [
    { existingProductId: 1, productUuid: "bad-uuid" },
    { existingProductId: 2, productUuid: UUID_2 },
  ];
  const input = {
    operationId: "uuid-order",
    guestItems: [guestCart()],
    accountItems: [],
  };
  const first = mergeGuestCartWithAccount({ ...input, productIdentityMap: forward });
  const second = mergeGuestCartWithAccount({
    ...input,
    productIdentityMap: [...forward].reverse(),
  });
  assert.deepEqual(first, second);
  assert.equal(first.newItems.length, 0);
});

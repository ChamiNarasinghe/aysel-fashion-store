import type {
  AccountCartItem,
  AccountWishlistItem,
  GuestCartItem,
  GuestWishlistItem,
  ProductIdentityMap,
} from "./types";

export type MergePersistenceStatus =
  | "not-attempted"
  | "not-supported-in-this-phase";

export type MergeConflictCode =
  | "invalid_operation_id"
  | "invalid_guest_line_id"
  | "invalid_guest_product_id"
  | "invalid_guest_size"
  | "invalid_guest_color"
  | "invalid_quantity"
  | "quantity_overflow"
  | "invalid_account_item"
  | "invalid_account_quantity"
  | "invalid_product_mapping"
  | "duplicate_account_variant"
  | "unmappable_guest_variant";

export type MergeConflict = {
  code: MergeConflictCode;
  message: string;
  guestLineIds: string[];
  numericProductId?: number;
  databaseProductId?: string;
};

export type CartMergeMatchedCandidate = {
  kind: "matched";
  accountItem: AccountCartItem;
  guestLineIds: string[];
  guestProductId: number;
  databaseProductId: string;
  displaySize: string;
  normalizedSize: string;
  displayColor: string;
  normalizedColor: string;
  mergedQuantity: number;
  availability: "requires-server-validation";
};

export type CartMergeNewCandidate = {
  kind: "new";
  guestLineIds: string[];
  guestProductId: number;
  databaseProductId: string;
  displaySize: string;
  normalizedSize: string;
  displayColor: string;
  normalizedColor: string;
  quantity: number;
  availability: "requires-server-validation";
};

export type WishlistMergeExistingCandidate = {
  kind: "already-in-account";
  accountItem: AccountWishlistItem;
  guestLineIds: string[];
  guestProductId: number;
};

export type WishlistMergeNewCandidate = {
  kind: "insert-required";
  guestLineIds: string[];
  guestProductId: number;
  productUuid: string;
  insertPermitted: true;
};

export type CartMergeResult = {
  operationId: string;
  operationContract: "merge-plan-only";
  persistenceStatus: MergePersistenceStatus;
  databaseIdempotencyStatus: "not-established";
  matched: CartMergeMatchedCandidate[];
  newItems: CartMergeNewCandidate[];
  conflicts: MergeConflict[];
};

export type WishlistMergeResult = {
  operationId: string;
  operationContract: "merge-plan-only";
  persistenceStatus: MergePersistenceStatus;
  databaseIdempotencyStatus: "not-established";
  existing: WishlistMergeExistingCandidate[];
  insertRequired: WishlistMergeNewCandidate[];
  conflicts: MergeConflict[];
};

export type MergeShoppingCartInput = {
  operationId: string;
  guestItems: readonly GuestCartItem[];
  accountItems: readonly AccountCartItem[];
  productIdentityMap: readonly ProductIdentityMap[];
};

export type MergeShoppingWishlistInput = {
  operationId: string;
  guestItems: readonly GuestWishlistItem[];
  accountItems: readonly AccountWishlistItem[];
  productIdentityMap: readonly ProductIdentityMap[];
};

const ALLOWED_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCanonicalUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return UUID_PATTERN.test(value.trim());
}

function normalizeUuid(value: unknown): string | null {
  if (!isCanonicalUuid(value)) return null;
  return (value as string).trim().toLowerCase();
}

function normalizeSize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return ALLOWED_SIZES.has(normalized) ? normalized : null;
}

function normalizeColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function displayGuestSize(value: string): string {
  return value;
}

function displayGuestColor(value: string): string {
  return value;
}

function validLineId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validProductId(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;
}

function validQuantity(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;
}

function conflict(
  code: MergeConflictCode,
  message: string,
  guestLineIds: readonly string[] = [],
  identities: { numericProductId?: number; databaseProductId?: string } = {}
): MergeConflict {
  return {
    code,
    message,
    guestLineIds: [...guestLineIds].sort(),
    ...identities,
  };
}

type MappingValidation = {
  numericToUuid: Map<number, string>;
  uuidToNumeric: Map<string, number>;
  invalidNumericIds: Set<number>;
  invalidDatabaseIds: Set<string>;
};

function validateMappings(
  mappings: readonly ProductIdentityMap[],
  conflicts: MergeConflict[]
): MappingValidation {
  const numericCandidates = new Map<number, Set<string>>();
  const uuidCandidates = new Map<string, Set<number>>();
  const invalidNumericIds = new Set<number>();
  const invalidDatabaseIds = new Set<string>();

  for (const mapping of mappings) {
    if (!validProductId(mapping.existingProductId)) {
      conflicts.push(conflict(
        "invalid_product_mapping",
        "A product identity mapping has an invalid numeric product ID."
      ));
      if (typeof mapping.productUuid === "string") {
        const databaseId = normalizeUuid(mapping.productUuid);
        if (databaseId !== null) invalidDatabaseIds.add(databaseId);
      }
      continue;
    }

    if (
      typeof mapping.productUuid !== "string" ||
      mapping.productUuid.trim().length === 0
    ) {
      invalidNumericIds.add(mapping.existingProductId);
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Database product mapping for numeric product ${mapping.existingProductId} is blank.`,
        [],
        { numericProductId: mapping.existingProductId }
      ));
      continue;
    }

    const numericId = mapping.existingProductId;
    const databaseId = normalizeUuid(mapping.productUuid);
    if (databaseId === null) {
      invalidNumericIds.add(numericId);
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Database product mapping for numeric product ${numericId} is not a canonical UUID.`,
        [],
        { numericProductId: numericId }
      ));
      continue;
    }
    const numericSet = numericCandidates.get(numericId) ?? new Set<string>();
    numericSet.add(databaseId);
    numericCandidates.set(numericId, numericSet);

    const uuidSet = uuidCandidates.get(databaseId) ?? new Set<number>();
    uuidSet.add(numericId);
    uuidCandidates.set(databaseId, uuidSet);
  }

  const numericToUuid = new Map<number, string>();
  const uuidToNumeric = new Map<string, number>();

  const sortedNumericIds = [...numericCandidates.keys()].sort((a, b) => a - b);
  for (const numericId of sortedNumericIds) {
    const databaseIds = [...(numericCandidates.get(numericId) ?? [])].sort();
    if (databaseIds.length !== 1) {
      invalidNumericIds.add(numericId);
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Numeric product ${numericId} maps to multiple database UUIDs: ${databaseIds.join(", ") || "(none)"}.`,
        [],
        { numericProductId: numericId }
      ));
      for (const databaseId of databaseIds) invalidDatabaseIds.add(databaseId);
    } else {
      numericToUuid.set(numericId, databaseIds[0]);
    }
  }

  const sortedDatabaseIds = [...uuidCandidates.keys()].sort();
  for (const databaseId of sortedDatabaseIds) {
    const numericIds = [...(uuidCandidates.get(databaseId) ?? [])].sort((a, b) => a - b);
    if (numericIds.length !== 1) {
      invalidDatabaseIds.add(databaseId);
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Database UUID ${databaseId} maps to multiple numeric products: ${numericIds.join(", ")}.`,
        [],
        { databaseProductId: databaseId }
      ));
      for (const numericId of numericIds) invalidNumericIds.add(numericId);
    } else {
      uuidToNumeric.set(databaseId, numericIds[0]);
    }
  }

  for (const numericId of invalidNumericIds) numericToUuid.delete(numericId);
  for (const databaseId of invalidDatabaseIds) uuidToNumeric.delete(databaseId);

  return {
    numericToUuid,
    uuidToNumeric,
    invalidNumericIds,
    invalidDatabaseIds,
  };
}

function validOperationId(operationId: unknown): operationId is string {
  return typeof operationId === "string" && operationId.trim().length > 0;
}

export function mergeGuestCartWithAccount(
  input: MergeShoppingCartInput
): CartMergeResult {
  const operationId = typeof input.operationId === "string"
    ? input.operationId
    : "";
  const conflicts: MergeConflict[] = [];
  const operationIdValid = validOperationId(input.operationId);

  if (!operationIdValid) {
    conflicts.push(conflict(
      "invalid_operation_id",
      "The merge operation ID must be a non-empty string."
    ));
  }

  const mapping = validateMappings(input.productIdentityMap, conflicts);
  const numericToUuid = mapping.numericToUuid;
  const accountByVariant = new Map<string, AccountCartItem[]>();
  const invalidAccountProducts = new Set<string>();
  const invalidAccountVariants = new Set<string>();
  let invalidAccountCartSnapshot = false;

  for (const accountItem of input.accountItems) {
    if (
      typeof accountItem.id !== "string" ||
      accountItem.id.trim().length === 0 ||
      typeof accountItem.cartId !== "string" ||
      accountItem.cartId.trim().length === 0 ||
      typeof accountItem.variantId !== "string" ||
      accountItem.variantId.trim().length === 0 ||
      typeof accountItem.productId !== "string" ||
      accountItem.productId.trim().length === 0
    ) {
      invalidAccountCartSnapshot = true;
      if (typeof accountItem.productId === "string" && accountItem.productId.trim()) {
        const rawProductId = accountItem.productId.trim();
        const accountDatabaseId = normalizeUuid(rawProductId);
        if (accountDatabaseId !== null) invalidAccountProducts.add(accountDatabaseId);
      }
      conflicts.push(conflict(
        "invalid_account_item",
        "An account cart item has incomplete database identity."
      ));
      continue;
    }

    const accountDatabaseId = normalizeUuid(accountItem.productId);
    if (accountDatabaseId === null) {
      invalidAccountCartSnapshot = true;
      conflicts.push(conflict(
        "invalid_account_item",
        "An account cart item contains an invalid database product UUID.",
        [],
        { databaseProductId: accountItem.productId.trim() }
      ));
      continue;
    }

    if (!validQuantity(accountItem.quantity)) {
      const size = normalizeSize(accountItem.size);
      const color = normalizeColor(accountItem.color);
      if (size !== null && color !== null) {
        invalidAccountVariants.add(`${accountDatabaseId}|${size}|${color}`);
      } else {
        invalidAccountProducts.add(accountDatabaseId);
      }
      conflicts.push(conflict(
        "invalid_account_quantity",
        "An account cart quantity is not a positive safe integer."
      ));
      continue;
    }

    const size = normalizeSize(accountItem.size);
    const color = normalizeColor(accountItem.color);
    if (size === null || color === null) {
      invalidAccountProducts.add(accountDatabaseId);
      conflicts.push(conflict(
        "invalid_account_item",
        "An account cart item has an invalid or incomplete size or colour."
      ));
      continue;
    }

    const key = `${accountDatabaseId}|${size}|${color}`;
    const existing = accountByVariant.get(key) ?? [];
    existing.push(accountItem);
    accountByVariant.set(key, existing);
  }

  const groupedGuests = new Map<
    string,
    {
      guestProductId: number;
      size: string;
      color: string;
      displaySize: string;
      displayColor: string;
      displayLineId: string;
      quantity: number;
      guestLineIds: string[];
    }
  >();
  const variantLineIds = new Map<string, Set<string>>();
  const blockedVariants = new Set<string>();
  const seenGuestLineIds = new Set<string>();
  const seenGuestLineVariants = new Map<string, string>();
  const variantConflictIndexes: Array<{ key: string; index: number }> = [];

  function blockVariant(
    key: string,
    code: MergeConflictCode,
    message: string,
    guestLineId: string | null,
    numericProductId?: number
  ): void {
    blockedVariants.add(key);
    const relevantLineIds = variantLineIds.get(key) ?? new Set<string>();
    if (guestLineId !== null) relevantLineIds.add(guestLineId);
    variantLineIds.set(key, relevantLineIds);
    conflicts.push(conflict(
      code,
      message,
      [...relevantLineIds],
      numericProductId === undefined ? {} : { numericProductId }
    ));
    variantConflictIndexes.push({ key, index: conflicts.length - 1 });
  }

  for (const guestItem of input.guestItems) {
    const guestLineId = validLineId(guestItem.lineId) ? guestItem.lineId : null;
    if (!validProductId(guestItem.productId)) {
      conflicts.push(conflict(
        "invalid_guest_product_id",
        "A guest cart product ID is not a positive safe integer.",
        guestLineId ? [guestLineId] : []
      ));
      continue;
    }

    const size = normalizeSize(guestItem.size);
    if (size === null) {
      conflicts.push(conflict(
        "invalid_guest_size",
        "A guest cart size is missing or not supported.",
        guestLineId ? [guestLineId] : []
      ));
      continue;
    }

    const color = normalizeColor(guestItem.color);
    if (color === null) {
      conflicts.push(conflict(
        "invalid_guest_color",
        "A guest cart colour is missing.",
        guestLineId ? [guestLineId] : []
      ));
      continue;
    }

    if (!validQuantity(guestItem.quantity)) {
      if (validProductId(guestItem.productId)) {
        const size = normalizeSize(guestItem.size);
        const color = normalizeColor(guestItem.color);
        if (size !== null && color !== null) {
          const key = `${guestItem.productId}|${size}|${color}`;
          blockVariant(
            key,
            "invalid_quantity",
            "A guest quantity is invalid; the entire normalized variant is blocked.",
            guestLineId,
            guestItem.productId
          );
        }
      }
      if (!(validProductId(guestItem.productId) &&
        normalizeSize(guestItem.size) !== null &&
        normalizeColor(guestItem.color) !== null)) {
        conflicts.push(conflict(
          "invalid_quantity",
          "A guest cart quantity must be a positive safe integer.",
          guestLineId ? [guestLineId] : []
        ));
      }
      continue;
    }

    const key = `${guestItem.productId}|${size}|${color}`;
    const relevantLineIds = variantLineIds.get(key) ?? new Set<string>();
    if (guestLineId !== null) relevantLineIds.add(guestLineId);
    variantLineIds.set(key, relevantLineIds);

    if (guestLineId !== null && seenGuestLineIds.has(guestLineId)) {
      const previousVariantKey = seenGuestLineVariants.get(guestLineId);
      if (previousVariantKey !== undefined) {
        blockVariant(
          previousVariantKey,
          "invalid_guest_line_id",
          "Duplicate guest line IDs are ambiguous; the entire normalized variant is blocked.",
          guestLineId,
          guestItem.productId
        );
      }
      blockVariant(
        key,
        "invalid_guest_line_id",
        "Duplicate guest line IDs are ambiguous; the entire normalized variant is blocked.",
        guestLineId,
        guestItem.productId
      );
      continue;
    }
    if (guestLineId !== null) {
      seenGuestLineIds.add(guestLineId);
      seenGuestLineVariants.set(guestLineId, key);
    }

    if (guestLineId === null) {
      blockVariant(
        key,
        "invalid_guest_line_id",
        "A guest cart line has no usable line ID; the entire normalized variant is blocked.",
        null,
        guestItem.productId
      );
      continue;
    }

    const existing = groupedGuests.get(key);
    if (existing === undefined) {
      groupedGuests.set(key, {
        guestProductId: guestItem.productId,
        size,
        color,
        displaySize: displayGuestSize(guestItem.size),
        displayColor: displayGuestColor(guestItem.color),
        displayLineId: guestLineId,
        quantity: guestItem.quantity,
        guestLineIds: [guestLineId],
      });
      continue;
    }

    if (!Number.isSafeInteger(existing.quantity + guestItem.quantity)) {
      blockVariant(
        key,
        "quantity_overflow",
        "Duplicate guest quantities exceed the safe integer range.",
        guestLineId,
        guestItem.productId
      );
      continue;
    }

    existing.quantity += guestItem.quantity;
    existing.guestLineIds.push(guestLineId);
    if (guestLineId.localeCompare(existing.displayLineId) < 0) {
      existing.displayLineId = guestLineId;
      existing.displaySize = displayGuestSize(guestItem.size);
      existing.displayColor = displayGuestColor(guestItem.color);
    }
  }

  for (const { key, index } of variantConflictIndexes) {
    const current = conflicts[index];
    if (current !== undefined) {
      conflicts[index] = {
        ...current,
        guestLineIds: [...(variantLineIds.get(key) ?? [])].sort(),
      };
    }
  }

  const matched: CartMergeMatchedCandidate[] = [];
  const newItems: CartMergeNewCandidate[] = [];

  const sortedGuests = [...groupedGuests.entries()].sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB)
  );

  for (const [, guest] of sortedGuests) {
    const normalizedVariantKey = `${guest.guestProductId}|${guest.size}|${guest.color}`;
    if (blockedVariants.has(normalizedVariantKey)) continue;
    if (invalidAccountCartSnapshot) {
      conflicts.push(conflict(
        "invalid_account_item",
        "The account cart snapshot contains malformed database identity; synchronization is blocked.",
        guest.guestLineIds,
        { numericProductId: guest.guestProductId }
      ));
      continue;
    }

    if (mapping.invalidNumericIds.has(guest.guestProductId)) {
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Numeric product ${guest.guestProductId} has conflicting or invalid database mappings; synchronization is blocked for this variant.`,
        guest.guestLineIds,
        { numericProductId: guest.guestProductId }
      ));
      continue;
    }

    const productUuid = numericToUuid.get(guest.guestProductId);
    if (productUuid === undefined) {
      conflicts.push(conflict(
        "unmappable_guest_variant",
        `Numeric product ${guest.guestProductId} has no valid database product mapping; server synchronization cannot proceed for this variant.`,
        guest.guestLineIds,
        { numericProductId: guest.guestProductId }
      ));
      continue;
    }

    if (mapping.invalidDatabaseIds.has(productUuid)) {
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Database UUID ${productUuid} has conflicting or invalid numeric mappings; synchronization is blocked for this variant.`,
        guest.guestLineIds,
        { numericProductId: guest.guestProductId, databaseProductId: productUuid }
      ));
      continue;
    }

    const accountKey = `${productUuid}|${guest.size}|${guest.color}`;
    if (invalidAccountProducts.has(productUuid) || invalidAccountVariants.has(accountKey)) {
      conflicts.push(conflict(
        "invalid_account_item",
        `The account snapshot contains an invalid entry for this variant; synchronization is blocked.`,
        guest.guestLineIds,
        { numericProductId: guest.guestProductId, databaseProductId: productUuid }
      ));
      continue;
    }

    const accountMatches = accountByVariant.get(accountKey) ?? [];

    if (accountMatches.length === 0) {
      newItems.push({
        kind: "new",
        guestLineIds: [...guest.guestLineIds].sort(),
        guestProductId: guest.guestProductId,
        databaseProductId: productUuid,
        displaySize: guest.displaySize,
        normalizedSize: guest.size,
        displayColor: guest.displayColor,
        normalizedColor: guest.color,
        quantity: guest.quantity,
        availability: "requires-server-validation",
      });
      continue;
    }

    if (accountMatches.length > 1) {
      conflicts.push(conflict(
        "duplicate_account_variant",
        "The account snapshot contains duplicate database variants.",
        guest.guestLineIds
      ));
      continue;
    }

    const accountItem = accountMatches[0];
    const mergedQuantity = accountItem.quantity + guest.quantity;
    if (!Number.isSafeInteger(mergedQuantity)) {
      blockVariant(
        normalizedVariantKey,
        "quantity_overflow",
        "Adding the guest quantity to the account quantity exceeds the safe integer range.",
        null,
        guest.guestProductId
      );
      continue;
    }

    matched.push({
      kind: "matched",
      accountItem,
      guestLineIds: [...guest.guestLineIds].sort(),
      guestProductId: guest.guestProductId,
      databaseProductId: productUuid,
      displaySize: guest.displaySize,
      normalizedSize: guest.size,
      displayColor: guest.displayColor,
      normalizedColor: guest.color,
      mergedQuantity,
      availability: "requires-server-validation",
    });
  }

  matched.sort((a, b) =>
    `${a.accountItem.id}|${a.normalizedSize}|${a.normalizedColor}`.localeCompare(
      `${b.accountItem.id}|${b.normalizedSize}|${b.normalizedColor}`
    )
  );
  newItems.sort((a, b) =>
    `${a.guestProductId}|${a.normalizedSize}|${a.normalizedColor}`.localeCompare(
      `${b.guestProductId}|${b.normalizedSize}|${b.normalizedColor}`
    )
  );
  conflicts.sort((a, b) =>
    `${a.code}|${a.message}|${a.guestLineIds.join(",")}`.localeCompare(
      `${b.code}|${b.message}|${b.guestLineIds.join(",")}`
    )
  );

  return {
    operationId,
    operationContract: "merge-plan-only",
    persistenceStatus: "not-attempted",
    databaseIdempotencyStatus: "not-established",
    matched: operationIdValid ? matched : [],
    newItems: operationIdValid ? newItems : [],
    conflicts,
  };
}

export function mergeGuestWishlistWithAccount(
  input: MergeShoppingWishlistInput
): WishlistMergeResult {
  const operationId = typeof input.operationId === "string"
    ? input.operationId
    : "";
  const conflicts: MergeConflict[] = [];
  const operationIdValid = validOperationId(input.operationId);

  if (!operationIdValid) {
    conflicts.push(conflict(
      "invalid_operation_id",
      "The merge operation ID must be a non-empty string."
    ));
  }

  const mapping = validateMappings(input.productIdentityMap, conflicts);
  const numericToUuid = mapping.numericToUuid;
  const uuidToNumeric = mapping.uuidToNumeric;

  const accountByProduct = new Map<string, AccountWishlistItem>();
  const accountByNumericId = new Map<number, AccountWishlistItem>();
  const ambiguousNumericIds = new Set<number>();
  const ambiguousDatabaseIds = new Set<string>();
  let invalidAccountWishlistSnapshot = false;

  for (const accountItem of input.accountItems) {
    if (
      typeof accountItem.id !== "string" ||
      accountItem.id.trim().length === 0 ||
      typeof accountItem.productId !== "string" ||
      accountItem.productId.trim().length === 0
    ) {
      invalidAccountWishlistSnapshot = true;
      conflicts.push(conflict(
        "invalid_account_item",
        "An account wishlist item has incomplete database identity."
      ));
      continue;
    }

    const databaseProductId = normalizeUuid(accountItem.productId);
    if (databaseProductId === null) {
      invalidAccountWishlistSnapshot = true;
      conflicts.push(conflict(
        "invalid_account_item",
        "An account wishlist item contains an invalid database product UUID.",
        [],
        { databaseProductId: accountItem.productId.trim() }
      ));
      continue;
    }
    if (accountByProduct.has(databaseProductId)) {
      ambiguousDatabaseIds.add(databaseProductId);
      if (accountItem.existingProductId !== null &&
        validProductId(accountItem.existingProductId)) {
        ambiguousNumericIds.add(accountItem.existingProductId);
      }
      conflicts.push(conflict(
        "invalid_account_item",
        "The account wishlist snapshot contains a duplicate database product identity.",
        [],
        {
          numericProductId: validProductId(accountItem.existingProductId)
            ? accountItem.existingProductId
            : undefined,
          databaseProductId,
        }
      ));
      continue;
    }

    accountByProduct.set(databaseProductId, accountItem);

    if (accountItem.existingProductId === null) {
      const inferredNumericId = uuidToNumeric.get(databaseProductId);
      if (inferredNumericId === undefined) {
        ambiguousDatabaseIds.add(databaseProductId);
        conflicts.push(conflict(
          "invalid_account_item",
          `Account wishlist product ${databaseProductId} has no valid numeric identity mapping.`,
          [],
          { databaseProductId }
        ));
        continue;
      }

      if (mapping.invalidNumericIds.has(inferredNumericId) ||
        mapping.invalidDatabaseIds.has(databaseProductId)) {
        ambiguousNumericIds.add(inferredNumericId);
        ambiguousDatabaseIds.add(databaseProductId);
        continue;
      }

      const prior = accountByNumericId.get(inferredNumericId);
      if (prior !== undefined) {
        ambiguousNumericIds.add(inferredNumericId);
        conflicts.push(conflict(
          "invalid_account_item",
          `Multiple account wishlist entries share numeric product identity ${inferredNumericId}.`,
          [],
          { numericProductId: inferredNumericId, databaseProductId }
        ));
        continue;
      }

      accountByNumericId.set(inferredNumericId, accountItem);
      continue;
    }

    if (!validProductId(accountItem.existingProductId)) {
      ambiguousDatabaseIds.add(databaseProductId);
      conflicts.push(conflict(
        "invalid_account_item",
        `Account wishlist product ${databaseProductId} has an invalid existingProductId.`,
        [],
        { databaseProductId }
      ));
      continue;
    }

    const numericId = accountItem.existingProductId;
    const mappedUuid = numericToUuid.get(numericId);
    const reverseNumericId = uuidToNumeric.get(databaseProductId);

    if (
      mappedUuid !== databaseProductId ||
      reverseNumericId !== numericId ||
      mapping.invalidNumericIds.has(numericId) ||
      mapping.invalidDatabaseIds.has(databaseProductId)
    ) {
      ambiguousNumericIds.add(numericId);
      ambiguousDatabaseIds.add(databaseProductId);
      conflicts.push(conflict(
        "invalid_account_item",
        `Account wishlist numeric identity ${numericId} is inconsistent with database UUID ${databaseProductId} or the supplied mapping.`,
        [],
        { numericProductId: numericId, databaseProductId }
      ));
      continue;
    }

    const prior = accountByNumericId.get(numericId);
    if (prior !== undefined) {
      ambiguousNumericIds.add(numericId);
      const priorDatabaseId = normalizeUuid(prior.productId);
      if (priorDatabaseId !== null) ambiguousDatabaseIds.add(priorDatabaseId);
      ambiguousDatabaseIds.add(databaseProductId);
      conflicts.push(conflict(
        "invalid_account_item",
        `Multiple account wishlist entries share numeric product identity ${numericId}.`,
        [],
        { numericProductId: numericId }
      ));
      continue;
    }

    accountByNumericId.set(numericId, accountItem);
  }

  const groupedGuests = new Map<
    number,
    { guestLineIds: string[] }
  >();
  const seenGuestLineIds = new Set<string>();
  const seenGuestLineProducts = new Map<string, number>();
  const blockedGuestProducts = new Set<number>();

  for (const guestItem of input.guestItems) {
    const guestLineId = validLineId(guestItem.lineId) ? guestItem.lineId : null;
    if (!validProductId(guestItem.productId)) {
      conflicts.push(conflict(
        "invalid_guest_product_id",
        "A guest wishlist product ID is not a positive safe integer.",
        guestLineId ? [guestLineId] : []
      ));
      continue;
    }

    if (guestLineId === null) {
      conflicts.push(conflict(
        "invalid_guest_line_id",
        "A guest wishlist line has no usable line ID; it cannot be confirmed or removed.",
        [],
        { numericProductId: guestItem.productId }
      ));
      continue;
    }

    if (seenGuestLineIds.has(guestLineId)) {
      blockedGuestProducts.add(guestItem.productId);
      const previousProductId = seenGuestLineProducts.get(guestLineId);
      if (previousProductId !== undefined) {
        blockedGuestProducts.add(previousProductId);
        conflicts.push(conflict(
          "invalid_guest_line_id",
          "Duplicate guest wishlist line IDs are ambiguous; synchronization is blocked for this product.",
          [guestLineId],
          { numericProductId: previousProductId }
        ));
      }
      conflicts.push(conflict(
        "invalid_guest_line_id",
        "Duplicate guest wishlist line IDs are ambiguous; synchronization is blocked for this product.",
        [guestLineId],
        { numericProductId: guestItem.productId }
      ));
      continue;
    }
    seenGuestLineIds.add(guestLineId);
    seenGuestLineProducts.set(guestLineId, guestItem.productId);

    const existing = groupedGuests.get(guestItem.productId);
    if (existing === undefined) {
      groupedGuests.set(guestItem.productId, { guestLineIds: [guestLineId] });
    } else {
      existing.guestLineIds.push(guestLineId);
    }
  }

  const existing: WishlistMergeExistingCandidate[] = [];
  const insertRequired: WishlistMergeNewCandidate[] = [];

  const sortedGuestIds = [...groupedGuests.keys()].sort((a, b) => a - b);

  for (const guestProductId of sortedGuestIds) {
    const guest = groupedGuests.get(guestProductId);
    if (guest === undefined) continue;
    if (blockedGuestProducts.has(guestProductId)) continue;
    if (invalidAccountWishlistSnapshot) {
      conflicts.push(conflict(
        "invalid_account_item",
        "The account wishlist snapshot contains malformed database identity; synchronization is blocked.",
        guest.guestLineIds,
        { numericProductId: guestProductId }
      ));
      continue;
    }

    if (mapping.invalidNumericIds.has(guestProductId)) {
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Numeric product ${guestProductId} has conflicting or invalid database mappings; synchronization is blocked for this product.`,
        guest.guestLineIds,
        { numericProductId: guestProductId }
      ));
      continue;
    }

    if (ambiguousNumericIds.has(guestProductId)) {
      conflicts.push(conflict(
        "invalid_account_item",
        `Account or mapping identity for numeric product ${guestProductId} is ambiguous; synchronization is blocked for this product.`,
        guest.guestLineIds,
        { numericProductId: guestProductId }
      ));
      continue;
    }

    const mappedUuid = numericToUuid.get(guestProductId);
    if (mappedUuid === undefined) {
      conflicts.push(conflict(
        "unmappable_guest_variant",
        `Numeric wishlist product ${guestProductId} has no valid database product mapping; server synchronization cannot proceed.`,
        guest.guestLineIds,
        { numericProductId: guestProductId }
      ));
      continue;
    }

    if (mapping.invalidDatabaseIds.has(mappedUuid)) {
      conflicts.push(conflict(
        "invalid_product_mapping",
        `Database UUID ${mappedUuid} has conflicting or invalid numeric mappings; synchronization is blocked for this product.`,
        guest.guestLineIds,
        { numericProductId: guestProductId, databaseProductId: mappedUuid }
      ));
      continue;
    }

    if (ambiguousDatabaseIds.has(mappedUuid)) {
      conflicts.push(conflict(
        "invalid_account_item",
        `Database UUID ${mappedUuid} has an ambiguous account wishlist identity; synchronization is blocked for this product.`,
        guest.guestLineIds,
        { numericProductId: guestProductId, databaseProductId: mappedUuid }
      ));
      continue;
    }

    const accountItem = accountByNumericId.get(guestProductId);
    if (accountItem !== undefined) {
      existing.push({
        kind: "already-in-account",
        accountItem,
        guestLineIds: [...guest.guestLineIds].sort(),
        guestProductId,
      });
      continue;
    }

    insertRequired.push({
      kind: "insert-required",
      guestLineIds: [...guest.guestLineIds].sort(),
      guestProductId,
      productUuid: mappedUuid,
      insertPermitted: true,
    });
  }

  existing.sort((a, b) =>
    `${a.accountItem.id}|${a.guestProductId}`.localeCompare(
      `${b.accountItem.id}|${b.guestProductId}`
    )
  );
  insertRequired.sort((a, b) => a.guestProductId - b.guestProductId);
  conflicts.sort((a, b) =>
    `${a.code}|${a.message}|${a.guestLineIds.join(",")}`.localeCompare(
      `${b.code}|${b.message}|${b.guestLineIds.join(",")}`
    )
  );

  return {
    operationId,
    operationContract: "merge-plan-only",
    persistenceStatus: "not-attempted",
    databaseIdempotencyStatus: "not-established",
    existing: operationIdValid ? existing : [],
    insertRequired: operationIdValid ? insertRequired : [],
    conflicts,
  };
}

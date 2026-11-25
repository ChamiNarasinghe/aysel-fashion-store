// Shared shopping types for AYSEL Phase 10.7.3A.
// Guest types are localStorage-backed; account types are in-memory only.

// ── Merge lock ────────────────────────────────────────────────────────────────

export type MergeLock = "none" | "pending";

// ── Guest types ───────────────────────────────────────────────────────────────

export type GuestCartItem = {
  lineId: string;
  productId: number;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  size: string;
  color: string;
  quantity: number;
  lineVersion: number;
  mergeLock: MergeLock;
};

export type GuestWishlistItem = {
  lineId: string;
  productId: number;
  mergeLock: MergeLock;
};

// ── Account types (database-backed, in-memory only this subphase) ─────────────

// Mirrors cart_items row joined with product display data.
export type AccountCartItem = {
  id: string;           // cart_items.id (UUID)
  cartId: string;       // carts.id (UUID)
  variantId: string;    // product_variants.id (UUID)
  productId: string;    // products.id (UUID)
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  serverPrice: number;  // authoritative price from server — never client-supplied
};

// Mirrors wishlists row joined with product display data.
export type AccountWishlistItem = {
  id: string;               // wishlists.id (UUID)
  productId: string;        // products.id (UUID)
  existingProductId: number | null; // products.existing_product_id — links to catalogue
  name: string;
  image: string;
};

// Caller-provided mapping used only by pure merge functions. The mapping links
// static catalogue identities to database identities; it does not create IDs.
export type ProductIdentityMap = {
  existingProductId: number;
  productUuid: string;
};

-- Migration 011: indexes
-- Covering the most common query patterns: slug lookups, category filtering,
-- variant lookups, and customer data access.

-- Product slug lookup (used on every product detail page)
CREATE INDEX IF NOT EXISTS idx_products_slug
  ON products (slug);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products (category_id);

-- Active product filtering
CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON products (is_active);

-- Featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured
  ON products (is_featured);

-- Preserve mapping from legacy numeric IDs
CREATE INDEX IF NOT EXISTS idx_products_existing_id
  ON products (existing_product_id);

-- Category slug lookup
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON categories (slug);

-- Variant lookups by product
CREATE INDEX IF NOT EXISTS idx_variants_product_id
  ON product_variants (product_id);

-- Variant SKU lookup
CREATE INDEX IF NOT EXISTS idx_variants_sku
  ON product_variants (sku)
  WHERE sku IS NOT NULL;

-- Product images by product
CREATE INDEX IF NOT EXISTS idx_images_product_id
  ON product_images (product_id);

-- Wishlist by user
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id
  ON wishlists (user_id);

-- Carts by user
CREATE INDEX IF NOT EXISTS idx_carts_user_id
  ON carts (user_id);

-- Cart items by cart
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id
  ON cart_items (cart_id);

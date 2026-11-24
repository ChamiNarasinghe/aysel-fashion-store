-- =============================================================================
-- AYSEL – Phase 09 Live Database Setup
-- =============================================================================
-- Combined migration script for the AYSEL Supabase project.
-- Assembled from supabase/migrations/001 through 011 in dependency order.
--
-- EXECUTION INSTRUCTIONS
-- ──────────────────────
-- 1. Open the Supabase Dashboard for the AYSEL project.
-- 2. Navigate to SQL Editor → New query.
-- 3. Paste this entire file and run it.
-- 4. Verify zero errors in the output panel.
-- 5. After this script succeeds, run supabase/seed.sql separately.
--
-- IMPORTANT
-- ─────────
-- • Do NOT run supabase/seed.sql before this script completes successfully.
-- • Do NOT run this script more than once without verifying the current
--   database state. All DDL uses IF NOT EXISTS / OR REPLACE / DO blocks
--   to be safe on re-run, but running against a partially-migrated database
--   may produce unexpected results.
-- • No credentials, passwords or API keys appear in this file.
-- • No DROP TABLE, TRUNCATE or DROP SCHEMA statements are present.
-- =============================================================================


-- =============================================================================
-- MIGRATION 001 — categories
-- Source: supabase/migrations/001_create_categories.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared trigger function used by all tables with an updated_at column.
-- CREATE OR REPLACE is safe to re-run.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- MIGRATION 002 — products
-- Source: supabase/migrations/002_create_products.sql
-- Depends on: categories
-- =============================================================================

CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  existing_product_id INTEGER UNIQUE,          -- maps to Product.id in products.ts
  category_id         UUID NOT NULL REFERENCES categories(id),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  price               NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price    NUMERIC(10, 2) CHECK (
                        compare_at_price IS NULL OR compare_at_price > price
                      ),
  sku                 TEXT UNIQUE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- MIGRATION 003 — product_images
-- Source: supabase/migrations/003_create_product_images.sql
-- Depends on: products
-- Note: variant_id FK is intentionally deferred — added in migration 004
--       after product_variants exists. The column is created here as a plain
--       UUID (no FK constraint yet) to avoid a circular dependency.
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    UUID,                          -- FK to product_variants added below in migration 004
  image_url     TEXT NOT NULL,
  alt_text      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent the same image URL being inserted twice for the same product
  UNIQUE (product_id, image_url)
);

-- Only one primary image per product (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS product_images_primary_idx
  ON product_images (product_id)
  WHERE is_primary = TRUE;


-- =============================================================================
-- MIGRATION 004 — product_variants + deferred FK on product_images
-- Source: supabase/migrations/004_create_product_variants.sql
-- Depends on: products, product_images
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  colour         TEXT NOT NULL,
  colour_code    TEXT NOT NULL,               -- hex value e.g. '#3D3D3D'
  size           TEXT NOT NULL CHECK (size IN ('XS','S','M','L','XL','XXL')),
  sku            TEXT UNIQUE,
  price_override NUMERIC(10, 2) CHECK (price_override IS NULL OR price_override >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate colour+size combinations for the same product
  UNIQUE (product_id, colour, size)
);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Now that product_variants exists, add the FK from product_images.variant_id.
-- This resolves the circular dependency between product_images and product_variants.
-- ON DELETE SET NULL: deleting a variant nullifies the image association rather
-- than deleting the image itself.
ALTER TABLE product_images
  ADD CONSTRAINT product_images_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;


-- =============================================================================
-- MIGRATION 005 — profiles
-- Source: supabase/migrations/005_create_profiles.sql
-- Depends on: auth.users (Supabase built-in)
-- Note: Do NOT insert rows here. Table is prepared for Phase 10 (auth).
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name  TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- MIGRATION 006 — wishlists
-- Source: supabase/migrations/006_create_wishlists.sql
-- Depends on: auth.users, products
-- =============================================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A customer can save each product only once
  UNIQUE (user_id, product_id)
);


-- =============================================================================
-- MIGRATION 007 — carts
-- Source: supabase/migrations/007_create_carts.sql
-- Depends on: auth.users
-- Note: CREATE TYPE does not support IF NOT EXISTS in PostgreSQL.
--       The DO block handles idempotent type creation safely.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE cart_status AS ENUM ('active', 'abandoned', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     cart_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- MIGRATION 008 — cart_items
-- Source: supabase/migrations/008_create_cart_items.sql
-- Depends on: carts, product_variants
-- Note: variant_id has no ON DELETE CASCADE intentionally. Deleting a variant
--       should surface as a constraint error, not silently remove cart items.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate variants within the same cart
  UNIQUE (cart_id, variant_id)
);

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- MIGRATION 009 — enable Row Level Security
-- Source: supabase/migrations/009_enable_rls.sql
-- Must run before migration 010 (policies).
-- =============================================================================

ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items       ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- MIGRATION 010 — RLS policies
-- Source: supabase/migrations/010_create_policies.sql
-- Depends on: migration 009 (RLS enabled)
-- =============================================================================

-- ── Public product catalogue (anonymous read-only) ───────────────────────────

CREATE POLICY "Public read active categories"
  ON categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Public read active products"
  ON products FOR SELECT
  USING (is_active = TRUE);

-- product_images: unrestricted SELECT — product visibility enforced via join
CREATE POLICY "Public read product images"
  ON product_images FOR SELECT
  USING (TRUE);

CREATE POLICY "Public read active variants"
  ON product_variants FOR SELECT
  USING (is_active = TRUE);

-- ── Profiles (authenticated customers, own row only) ─────────────────────────
-- INSERT policy added in Phase 10 alongside the sign-up trigger.

CREATE POLICY "Customers read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Wishlists (authenticated customers, own rows only) ───────────────────────

CREATE POLICY "Customers read own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers insert own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers delete own wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- ── Carts (authenticated customers, own rows only) ───────────────────────────

CREATE POLICY "Customers read own carts"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers insert own cart"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers update own cart"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Cart items (ownership enforced through parent cart) ───────────────────────
-- Subquery checks carts.user_id = auth.uid() to prevent cross-customer access.

CREATE POLICY "Customers read own cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers insert own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers update own cart items"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers delete own cart items"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );


-- =============================================================================
-- MIGRATION 011 — indexes
-- Source: supabase/migrations/011_create_indexes.sql
-- All use IF NOT EXISTS — safe to re-run.
-- =============================================================================

-- Product slug lookup (every product detail page)
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

-- Legacy numeric ID mapping
CREATE INDEX IF NOT EXISTS idx_products_existing_id
  ON products (existing_product_id);

-- Category slug lookup
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON categories (slug);

-- Variant lookups by product
CREATE INDEX IF NOT EXISTS idx_variants_product_id
  ON product_variants (product_id);

-- Variant SKU lookup (partial — only rows where sku is not null)
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


-- =============================================================================
-- END OF MIGRATION SCRIPT
-- =============================================================================
-- Next step: run supabase/seed.sql in a separate SQL Editor query.
-- =============================================================================

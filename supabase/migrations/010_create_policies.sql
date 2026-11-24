-- Migration 010: RLS policies
-- ─────────────────────────────────────────────────────────────────────────────
-- PUBLIC PRODUCT TABLES
-- Anonymous visitors may read active records only.
-- No write access is granted to anonymous users.
-- ─────────────────────────────────────────────────────────────────────────────

-- categories: public read of active categories
CREATE POLICY "Public read active categories"
  ON categories FOR SELECT
  USING (is_active = TRUE);

-- products: public read of active products
CREATE POLICY "Public read active products"
  ON products FOR SELECT
  USING (is_active = TRUE);

-- product_images: public read (inherits product visibility via join in app)
CREATE POLICY "Public read product images"
  ON product_images FOR SELECT
  USING (TRUE);

-- product_variants: public read of active variants
CREATE POLICY "Public read active variants"
  ON product_variants FOR SELECT
  USING (is_active = TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- Authenticated customers can read and update their own profile only.
-- Phase 10 will add profile creation on sign-up via a database trigger.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Customers read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- WISHLISTS
-- Authenticated customers can manage their own wishlist entries only.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "Customers read own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers insert own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers delete own wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CARTS
-- Authenticated customers can manage their own carts only.
-- ─────────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────────
-- CART ITEMS
-- Ownership is enforced by checking the parent cart's user_id.
-- This prevents a customer from inserting items into another customer's cart.
-- ─────────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES FOR PHASE 10
-- • Add a trigger on auth.users INSERT to auto-create a profiles row.
-- • Add a policy allowing profiles INSERT for new sign-ups.
-- • Verify wishlist migration path from localStorage ids → product UUIDs.
-- ─────────────────────────────────────────────────────────────────────────────

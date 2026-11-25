-- Migration 013: grant minimum required table privileges
-- ─────────────────────────────────────────────────────────────────────────────
-- PostgreSQL evaluates table-level privileges BEFORE RLS policies.
-- Without an explicit GRANT, PostgREST returns 42501 "permission denied"
-- even when the RLS policy would allow the row.
--
-- anon role  : read-only access to public product/category tables.
-- authenticated role: read/write access to their own rows, enforced by RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- Public product tables — anon + authenticated may read
GRANT SELECT ON categories       TO anon, authenticated;
GRANT SELECT ON products         TO anon, authenticated;
GRANT SELECT ON product_images   TO anon, authenticated;
GRANT SELECT ON product_variants TO anon, authenticated;

-- Profiles — authenticated only; RLS restricts to own row
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Wishlists — authenticated only; RLS restricts to own rows
GRANT SELECT, INSERT, DELETE ON wishlists TO authenticated;

-- Carts — authenticated only; RLS restricts to own rows
GRANT SELECT, INSERT, UPDATE ON carts TO authenticated;

-- Cart items — authenticated only; RLS restricts via parent cart ownership
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;

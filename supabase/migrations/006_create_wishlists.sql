-- Migration 006: wishlists
-- Prepared for future migration from localStorage (Phase 10+).
-- user_id references auth.users so it works with Supabase Auth.

CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A customer can save each product only once
  UNIQUE (user_id, product_id)
);

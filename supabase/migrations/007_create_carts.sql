-- Migration 007: carts
-- Prepared for future authenticated cart persistence (Phase 10+).
-- A customer may have multiple carts over time (e.g. abandoned, completed).

-- CREATE TYPE does not support IF NOT EXISTS in PostgreSQL.
-- Use a DO block to create the type only if it does not already exist.
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

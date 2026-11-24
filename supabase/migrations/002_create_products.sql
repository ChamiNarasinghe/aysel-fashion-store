-- Migration 002: products
-- existing_product_id preserves the numeric IDs from src/data/products.ts
-- so the frontend can continue using its static data while the DB is prepared.

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

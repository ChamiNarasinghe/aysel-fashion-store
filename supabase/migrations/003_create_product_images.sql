-- Migration 003: product_images
-- Supports multiple images per product and optional variant-specific images.

CREATE TABLE IF NOT EXISTS product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- variant_id is nullable: NULL means the image belongs to the product generally
  variant_id    UUID,                          -- FK added after product_variants is created (migration 004)
  image_url     TEXT NOT NULL,
  alt_text      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent the same image URL being inserted twice for the same product
  UNIQUE (product_id, image_url)
);

-- Only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS product_images_primary_idx
  ON product_images (product_id)
  WHERE is_primary = TRUE;

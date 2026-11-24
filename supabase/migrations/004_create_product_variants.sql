-- Migration 004: product_variants
-- Each variant is a unique colour + size combination for a product.
--
-- Stock note: the existing products.ts stores stock at product level only
-- (stockCount). There is no per-variant stock data in the source catalogue.
-- stock_quantity defaults to 0 here; the seed script distributes product-level
-- stock equally across variants as an approximation and documents this clearly.

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

-- Now that product_variants exists, add the FK from product_images.variant_id
ALTER TABLE product_images
  ADD CONSTRAINT product_images_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

-- supabase/seed.sql
-- Seed data derived from src/data/products.ts
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING with explicit targets
--
-- STOCK NOTE: The existing products.ts stores stock at product level only
-- (stockCount). There is no per-variant stock data in the source catalogue.
-- The stock_quantity values below are UNCONFIGURED PLACEHOLDERS only:
--   - Variants with available=false in the size arrays receive stock_quantity=0.
--   - Variants with available=true receive stock_quantity=1 as a placeholder.
-- These values do NOT represent actual inventory and must NOT be used as
-- production stock levels. Accurate per-variant quantities must be entered
-- manually in the Supabase dashboard before going live.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CATEGORIES ────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, slug, description, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Outerwear',  'outerwear',  'Blazers, coats and jackets', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Tops',       'tops',       'Sweaters, knits and cardigans', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Trousers',   'trousers',   'Tailored and casual trousers', TRUE),
  ('00000000-0000-0000-0000-000000000004', 'Shirts',     'shirts',     'Linen and cotton shirts', TRUE),
  ('00000000-0000-0000-0000-000000000005', 'Dresses',    'dresses',    'Wrap, midi and occasion dresses', TRUE),
  ('00000000-0000-0000-0000-000000000006', 'T-shirts',   't-shirts',   'Premium everyday T-shirts', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. PRODUCTS ──────────────────────────────────────────────────────────────
-- existing_product_id maps to Product.id in src/data/products.ts

INSERT INTO products (id, existing_product_id, category_id, name, slug, description, price, is_active, is_featured, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 1,  '00000000-0000-0000-0000-000000000001', 'The Essential Blazer',       'the-essential-blazer',       'A structured blazer crafted from premium wool blend. Timeless silhouette for every occasion.',                    12900, TRUE, TRUE,  '2025-03-15'),
  ('10000000-0000-0000-0000-000000000002', 2,  '00000000-0000-0000-0000-000000000002', 'Soft Knit Sweater',          'soft-knit-sweater',          'Luxuriously soft knit sweater in a relaxed fit. Perfect for layering through the seasons.',                        8500,  TRUE, FALSE, '2025-03-20'),
  ('10000000-0000-0000-0000-000000000003', 3,  '00000000-0000-0000-0000-000000000003', 'Classic Tailored Trousers',  'classic-tailored-trousers',  'Impeccably tailored trousers with a clean, modern cut. A wardrobe essential.',                                    9900,  TRUE, TRUE,  '2025-01-10'),
  ('10000000-0000-0000-0000-000000000004', 4,  '00000000-0000-0000-0000-000000000004', 'Everyday Linen Shirt',       'everyday-linen-shirt',       'Breathable linen shirt with a relaxed drape. Effortlessly elegant for warm days.',                                7200,  TRUE, FALSE, '2025-01-22'),
  ('10000000-0000-0000-0000-000000000005', 5,  '00000000-0000-0000-0000-000000000005', 'Silk Wrap Dress',            'silk-wrap-dress',            'A fluid wrap dress in a luxurious silk blend. Flattering for every silhouette.',                                  15800, TRUE, TRUE,  '2025-04-01'),
  ('10000000-0000-0000-0000-000000000006', 6,  '00000000-0000-0000-0000-000000000003', 'Relaxed Linen Trousers',     'relaxed-linen-trousers',     'Wide-leg linen trousers with a high waist. Comfortable and refined.',                                            8900,  TRUE, FALSE, '2024-12-05'),
  ('10000000-0000-0000-0000-000000000007', 7,  '00000000-0000-0000-0000-000000000005', 'Structured Midi Dress',      'structured-midi-dress',      'A structured midi dress with clean lines and a contemporary silhouette.',                                         13500, TRUE, FALSE, '2025-03-28'),
  ('10000000-0000-0000-0000-000000000008', 8,  '00000000-0000-0000-0000-000000000002', 'Fine Knit Cardigan',         'fine-knit-cardigan',         'A lightweight fine-knit cardigan. Versatile layering piece for any season.',                                      9200,  TRUE, FALSE, '2024-11-18'),
  ('10000000-0000-0000-0000-000000000009', 9,  '00000000-0000-0000-0000-000000000004', 'Oxford Button-Down Shirt',   'oxford-button-down-shirt',   'A classic Oxford shirt in premium cotton. Crisp, clean and endlessly versatile.',                                 8900,  TRUE, TRUE,  '2025-03-10'),
  ('10000000-0000-0000-0000-000000000010', 10, '00000000-0000-0000-0000-000000000003', 'Slim Chino Trousers',        'slim-chino-trousers',        'Slim-fit chino trousers in a refined cotton twill. Smart casual perfection.',                                     9500,  TRUE, TRUE,  '2025-02-14'),
  ('10000000-0000-0000-0000-000000000011', 11, '00000000-0000-0000-0000-000000000006', 'Merino Wool T-Shirt',        'merino-wool-tshirt',         'A premium merino wool T-shirt with a clean, minimal aesthetic.',                                                  6800,  TRUE, FALSE, '2025-04-05'),
  ('10000000-0000-0000-0000-000000000012', 12, '00000000-0000-0000-0000-000000000001', 'Tailored Wool Blazer',       'tailored-wool-blazer',       'A sharp tailored blazer in Italian wool. Elevate any outfit effortlessly.',                                       18500, TRUE, TRUE,  '2024-10-30'),
  ('10000000-0000-0000-0000-000000000013', 13, '00000000-0000-0000-0000-000000000004', 'Linen Casual Shirt',         'linen-casual-shirt',         'A relaxed linen shirt for warm-weather dressing. Effortless and refined.',                                       7600,  TRUE, FALSE, '2025-04-10'),
  ('10000000-0000-0000-0000-000000000014', 14, '00000000-0000-0000-0000-000000000006', 'Classic Crew Neck Tee',      'classic-crew-neck-tee',      'A perfectly weighted crew neck T-shirt in Pima cotton. The everyday essential.',                                  5200,  TRUE, FALSE, '2024-09-01'),
  ('10000000-0000-0000-0000-000000000015', 15, '00000000-0000-0000-0000-000000000001', 'Wool Overcoat',              'wool-overcoat',              'A full-length wool overcoat with a clean, architectural silhouette.',                                             24900, TRUE, TRUE,  '2025-03-25'),
  ('10000000-0000-0000-0000-000000000016', 16, '00000000-0000-0000-0000-000000000003', 'Straight Leg Denim',         'straight-leg-denim',         'Premium straight-leg denim in a dark indigo wash. Refined casual dressing.',                                      11200, TRUE, FALSE, '2025-02-01')
ON CONFLICT (slug) DO NOTHING;

-- ── 3. PRODUCT IMAGES ────────────────────────────────────────────────────────

INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
  -- Product 1: The Essential Blazer
  ('10000000-0000-0000-0000-000000000001', '/images/product-01.jpg',          'The Essential Blazer',      0, TRUE),
  ('10000000-0000-0000-0000-000000000001', '/images/product-02.jpg',          'The Essential Blazer alt',  1, FALSE),
  ('10000000-0000-0000-0000-000000000001', '/images/featured-collection.jpg', 'The Essential Blazer alt2', 2, FALSE),
  -- Product 2: Soft Knit Sweater
  ('10000000-0000-0000-0000-000000000002', '/images/product-02.jpg', 'Soft Knit Sweater',     0, TRUE),
  ('10000000-0000-0000-0000-000000000002', '/images/product-04.jpg', 'Soft Knit Sweater alt', 1, FALSE),
  -- Product 3: Classic Tailored Trousers
  ('10000000-0000-0000-0000-000000000003', '/images/product-03.jpg', 'Classic Tailored Trousers',     0, TRUE),
  ('10000000-0000-0000-0000-000000000003', '/images/product-01.jpg', 'Classic Tailored Trousers alt', 1, FALSE),
  -- Product 4: Everyday Linen Shirt
  ('10000000-0000-0000-0000-000000000004', '/images/product-04.jpg',      'Everyday Linen Shirt',     0, TRUE),
  ('10000000-0000-0000-0000-000000000004', '/images/category-women.jpg',  'Everyday Linen Shirt alt', 1, FALSE),
  -- Product 5: Silk Wrap Dress
  ('10000000-0000-0000-0000-000000000005', '/images/category-women.jpg', 'Silk Wrap Dress',      0, TRUE),
  ('10000000-0000-0000-0000-000000000005', '/images/hero-campaign.jpg',  'Silk Wrap Dress alt',  1, FALSE),
  ('10000000-0000-0000-0000-000000000005', '/images/product-04.jpg',     'Silk Wrap Dress alt2', 2, FALSE),
  -- Product 6: Relaxed Linen Trousers
  ('10000000-0000-0000-0000-000000000006', '/images/featured-collection.jpg', 'Relaxed Linen Trousers',     0, TRUE),
  ('10000000-0000-0000-0000-000000000006', '/images/product-03.jpg',          'Relaxed Linen Trousers alt', 1, FALSE),
  -- Product 7: Structured Midi Dress
  ('10000000-0000-0000-0000-000000000007', '/images/hero-campaign.jpg',   'Structured Midi Dress',      0, TRUE),
  ('10000000-0000-0000-0000-000000000007', '/images/category-women.jpg',  'Structured Midi Dress alt',  1, FALSE),
  ('10000000-0000-0000-0000-000000000007', '/images/product-01.jpg',      'Structured Midi Dress alt2', 2, FALSE),
  -- Product 8: Fine Knit Cardigan
  ('10000000-0000-0000-0000-000000000008', '/images/product-02.jpg', 'Fine Knit Cardigan',     0, TRUE),
  ('10000000-0000-0000-0000-000000000008', '/images/product-04.jpg', 'Fine Knit Cardigan alt', 1, FALSE),
  -- Product 9: Oxford Button-Down Shirt
  ('10000000-0000-0000-0000-000000000009', '/images/category-men.jpg', 'Oxford Button-Down Shirt',     0, TRUE),
  ('10000000-0000-0000-0000-000000000009', '/images/product-04.jpg',   'Oxford Button-Down Shirt alt', 1, FALSE),
  -- Product 10: Slim Chino Trousers
  ('10000000-0000-0000-0000-000000000010', '/images/product-03.jpg', 'Slim Chino Trousers',     0, TRUE),
  ('10000000-0000-0000-0000-000000000010', '/images/product-01.jpg', 'Slim Chino Trousers alt', 1, FALSE),
  -- Product 11: Merino Wool T-Shirt
  ('10000000-0000-0000-0000-000000000011', '/images/product-04.jpg', 'Merino Wool T-Shirt',     0, TRUE),
  ('10000000-0000-0000-0000-000000000011', '/images/product-02.jpg', 'Merino Wool T-Shirt alt', 1, FALSE),
  -- Product 12: Tailored Wool Blazer
  ('10000000-0000-0000-0000-000000000012', '/images/product-01.jpg',          'Tailored Wool Blazer',      0, TRUE),
  ('10000000-0000-0000-0000-000000000012', '/images/category-men.jpg',        'Tailored Wool Blazer alt',  1, FALSE),
  ('10000000-0000-0000-0000-000000000012', '/images/featured-collection.jpg', 'Tailored Wool Blazer alt2', 2, FALSE),
  -- Product 13: Linen Casual Shirt
  ('10000000-0000-0000-0000-000000000013', '/images/featured-collection.jpg', 'Linen Casual Shirt',     0, TRUE),
  ('10000000-0000-0000-0000-000000000013', '/images/product-04.jpg',          'Linen Casual Shirt alt', 1, FALSE),
  -- Product 14: Classic Crew Neck Tee
  ('10000000-0000-0000-0000-000000000014', '/images/product-02.jpg', 'Classic Crew Neck Tee',     0, TRUE),
  ('10000000-0000-0000-0000-000000000014', '/images/product-04.jpg', 'Classic Crew Neck Tee alt', 1, FALSE),
  -- Product 15: Wool Overcoat
  ('10000000-0000-0000-0000-000000000015', '/images/hero-campaign.jpg', 'Wool Overcoat',      0, TRUE),
  ('10000000-0000-0000-0000-000000000015', '/images/product-01.jpg',   'Wool Overcoat alt',  1, FALSE),
  ('10000000-0000-0000-0000-000000000015', '/images/category-men.jpg', 'Wool Overcoat alt2', 2, FALSE),
  -- Product 16: Straight Leg Denim
  ('10000000-0000-0000-0000-000000000016', '/images/product-01.jpg', 'Straight Leg Denim',     0, TRUE),
  ('10000000-0000-0000-0000-000000000016', '/images/product-03.jpg', 'Straight Leg Denim alt', 1, FALSE)
ON CONFLICT (product_id, image_url) DO NOTHING;

-- ── 4. PRODUCT VARIANTS ──────────────────────────────────────────────────────
-- STOCK PLACEHOLDERS: stock_quantity=1 for available sizes, 0 for unavailable.
-- These are unconfigured placeholders derived from the size availability flags
-- in products.ts. They do NOT represent real inventory.
-- All values must be replaced with accurate stock before going live.
--
-- Product 1: The Essential Blazer — all 6 sizes available across 3 colours

INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Charcoal',   '#3D3D3D', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Charcoal',   '#3D3D3D', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Charcoal',   '#3D3D3D', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Charcoal',   '#3D3D3D', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Charcoal',   '#3D3D3D', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Charcoal',   '#3D3D3D', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Ivory',      '#FAF8F2', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Ivory',      '#FAF8F2', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Ivory',      '#FAF8F2', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Ivory',      '#FAF8F2', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Ivory',      '#FAF8F2', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Ivory',      '#FAF8F2', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Deep Camel', '#C19A6B', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Deep Camel', '#C19A6B', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Deep Camel', '#C19A6B', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Deep Camel', '#C19A6B', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Deep Camel', '#C19A6B', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'Deep Camel', '#C19A6B', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 2: Soft Knit Sweater — all 6 sizes available across 4 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Oatmeal',    '#D4C5A9', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Oatmeal',    '#D4C5A9', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Oatmeal',    '#D4C5A9', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Oatmeal',    '#D4C5A9', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Oatmeal',    '#D4C5A9', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Oatmeal',    '#D4C5A9', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Dusty Rose', '#C9A0A0', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Dusty Rose', '#C9A0A0', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Dusty Rose', '#C9A0A0', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Dusty Rose', '#C9A0A0', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Dusty Rose', '#C9A0A0', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Dusty Rose', '#C9A0A0', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Sage',       '#8A9E85', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Sage',       '#8A9E85', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Sage',       '#8A9E85', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Sage',       '#8A9E85', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Sage',       '#8A9E85', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Sage',       '#8A9E85', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Midnight',   '#1C1C2E', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Midnight',   '#1C1C2E', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Midnight',   '#1C1C2E', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Midnight',   '#1C1C2E', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Midnight',   '#1C1C2E', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Midnight',   '#1C1C2E', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 3: Classic Tailored Trousers — all 6 sizes available across 3 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000003', 'Black', '#171515', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Black', '#171515', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Black', '#171515', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Black', '#171515', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Black', '#171515', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Black', '#171515', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Stone', '#C8B89A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Stone', '#C8B89A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Stone', '#C8B89A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Stone', '#C8B89A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Stone', '#C8B89A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Stone', '#C8B89A', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Navy',  '#1B2A4A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Navy',  '#1B2A4A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Navy',  '#1B2A4A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Navy',  '#1B2A4A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Navy',  '#1B2A4A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Navy',  '#1B2A4A', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 4: Everyday Linen Shirt — all 6 sizes available across 3 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000004', 'White',    '#FFFFFF', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'White',    '#FFFFFF', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'White',    '#FFFFFF', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'White',    '#FFFFFF', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'White',    '#FFFFFF', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'White',    '#FFFFFF', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sand',     '#D4B896', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sand',     '#D4B896', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sand',     '#D4B896', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sand',     '#D4B896', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sand',     '#D4B896', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sand',     '#D4B896', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sky Blue', '#A8C5DA', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sky Blue', '#A8C5DA', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sky Blue', '#A8C5DA', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sky Blue', '#A8C5DA', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sky Blue', '#A8C5DA', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Sky Blue', '#A8C5DA', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 5: Silk Wrap Dress — all 6 sizes available across 3 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000005', 'Champagne', '#F7E7CE', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Champagne', '#F7E7CE', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Champagne', '#F7E7CE', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Champagne', '#F7E7CE', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Champagne', '#F7E7CE', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Champagne', '#F7E7CE', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Burgundy',  '#5B0E14', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Burgundy',  '#5B0E14', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Burgundy',  '#5B0E14', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Burgundy',  '#5B0E14', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Burgundy',  '#5B0E14', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Burgundy',  '#5B0E14', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Forest',    '#2D4A3E', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Forest',    '#2D4A3E', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Forest',    '#2D4A3E', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Forest',    '#2D4A3E', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Forest',    '#2D4A3E', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Forest',    '#2D4A3E', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 6: Relaxed Linen Trousers — lowStockSizes: S,M,L available; XS,XL,XXL unavailable (stock_quantity=0)
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000006', 'Natural',   '#E8DCC8', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Natural',   '#E8DCC8', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Natural',   '#E8DCC8', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Natural',   '#E8DCC8', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Natural',   '#E8DCC8', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Natural',   '#E8DCC8', 'XXL', 0, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Terracotta','#C4714A', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Terracotta','#C4714A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Terracotta','#C4714A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Terracotta','#C4714A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Terracotta','#C4714A', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Terracotta','#C4714A', 'XXL', 0, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 7: Structured Midi Dress — all 6 sizes available across 3 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000007', 'Onyx',   '#1A1A1A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Onyx',   '#1A1A1A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Onyx',   '#1A1A1A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Onyx',   '#1A1A1A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Onyx',   '#1A1A1A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Onyx',   '#1A1A1A', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ecru',   '#F0EAD6', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ecru',   '#F0EAD6', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ecru',   '#F0EAD6', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ecru',   '#F0EAD6', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ecru',   '#F0EAD6', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ecru',   '#F0EAD6', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Cobalt', '#1F3A8A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Cobalt', '#1F3A8A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Cobalt', '#1F3A8A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Cobalt', '#1F3A8A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Cobalt', '#1F3A8A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Cobalt', '#1F3A8A', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 8: Fine Knit Cardigan — all 6 sizes available across 4 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000008', 'Cream',    '#FFFDD0', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Cream',    '#FFFDD0', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Cream',    '#FFFDD0', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Cream',    '#FFFDD0', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Cream',    '#FFFDD0', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Cream',    '#FFFDD0', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Blush',    '#F4C2C2', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Blush',    '#F4C2C2', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Blush',    '#F4C2C2', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Blush',    '#F4C2C2', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Blush',    '#F4C2C2', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Blush',    '#F4C2C2', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Camel',    '#C19A6B', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Camel',    '#C19A6B', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Camel',    '#C19A6B', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Camel',    '#C19A6B', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Camel',    '#C19A6B', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Camel',    '#C19A6B', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Charcoal', '#3D3D3D', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Charcoal', '#3D3D3D', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Charcoal', '#3D3D3D', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Charcoal', '#3D3D3D', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Charcoal', '#3D3D3D', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Charcoal', '#3D3D3D', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 9: Oxford Button-Down Shirt — all 6 sizes available across 3 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000009', 'White',      '#FFFFFF', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'White',      '#FFFFFF', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'White',      '#FFFFFF', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'White',      '#FFFFFF', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'White',      '#FFFFFF', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'White',      '#FFFFFF', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Light Blue', '#A8C5DA', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Light Blue', '#A8C5DA', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Light Blue', '#A8C5DA', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Light Blue', '#A8C5DA', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Light Blue', '#A8C5DA', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Light Blue', '#A8C5DA', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Pink',       '#F4C2C2', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Pink',       '#F4C2C2', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Pink',       '#F4C2C2', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Pink',       '#F4C2C2', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Pink',       '#F4C2C2', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Pink',       '#F4C2C2', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 10: Slim Chino Trousers — all 6 sizes available across 4 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000010', 'Khaki', '#C3B091', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Khaki', '#C3B091', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Khaki', '#C3B091', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Khaki', '#C3B091', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Khaki', '#C3B091', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Khaki', '#C3B091', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Navy',  '#1B2A4A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Navy',  '#1B2A4A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Navy',  '#1B2A4A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Navy',  '#1B2A4A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Navy',  '#1B2A4A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Navy',  '#1B2A4A', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Olive', '#6B7C45', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Olive', '#6B7C45', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Olive', '#6B7C45', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Olive', '#6B7C45', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Olive', '#6B7C45', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Olive', '#6B7C45', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Stone', '#C8B89A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Stone', '#C8B89A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Stone', '#C8B89A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Stone', '#C8B89A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Stone', '#C8B89A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Stone', '#C8B89A', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 11: Merino Wool T-Shirt — all 6 sizes available across 4 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000011', 'White',      '#FFFFFF', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'White',      '#FFFFFF', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'White',      '#FFFFFF', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'White',      '#FFFFFF', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'White',      '#FFFFFF', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'White',      '#FFFFFF', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Black',      '#171515', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Black',      '#171515', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Black',      '#171515', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Black',      '#171515', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Black',      '#171515', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Black',      '#171515', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Slate Grey', '#708090', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Slate Grey', '#708090', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Slate Grey', '#708090', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Slate Grey', '#708090', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Slate Grey', '#708090', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Slate Grey', '#708090', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Navy',       '#1B2A4A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Navy',       '#1B2A4A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Navy',       '#1B2A4A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Navy',       '#1B2A4A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Navy',       '#1B2A4A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Navy',       '#1B2A4A', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 12: Tailored Wool Blazer — limitedSizes: S,M,L available; XS,XL,XXL unavailable (stock_quantity=0)
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000012', 'Charcoal', '#3D3D3D', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Charcoal', '#3D3D3D', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Charcoal', '#3D3D3D', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Charcoal', '#3D3D3D', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Charcoal', '#3D3D3D', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Charcoal', '#3D3D3D', 'XXL', 0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Navy',     '#1B2A4A', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Navy',     '#1B2A4A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Navy',     '#1B2A4A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Navy',     '#1B2A4A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Navy',     '#1B2A4A', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Navy',     '#1B2A4A', 'XXL', 0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Camel',    '#C19A6B', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Camel',    '#C19A6B', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Camel',    '#C19A6B', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Camel',    '#C19A6B', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Camel',    '#C19A6B', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Camel',    '#C19A6B', 'XXL', 0, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 13: Linen Casual Shirt — all 6 sizes available across 4 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000013', 'Natural',  '#E8DCC8', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Natural',  '#E8DCC8', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Natural',  '#E8DCC8', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Natural',  '#E8DCC8', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Natural',  '#E8DCC8', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Natural',  '#E8DCC8', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sky Blue', '#A8C5DA', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sky Blue', '#A8C5DA', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sky Blue', '#A8C5DA', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sky Blue', '#A8C5DA', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sky Blue', '#A8C5DA', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sky Blue', '#A8C5DA', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sage',     '#8A9E85', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sage',     '#8A9E85', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sage',     '#8A9E85', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sage',     '#8A9E85', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sage',     '#8A9E85', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Sage',     '#8A9E85', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'White',    '#FFFFFF', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'White',    '#FFFFFF', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'White',    '#FFFFFF', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'White',    '#FFFFFF', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'White',    '#FFFFFF', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000013', 'White',    '#FFFFFF', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 14: Classic Crew Neck Tee — all 6 sizes available across 5 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000014', 'White',    '#FFFFFF', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'White',    '#FFFFFF', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'White',    '#FFFFFF', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'White',    '#FFFFFF', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'White',    '#FFFFFF', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'White',    '#FFFFFF', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Black',    '#171515', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Black',    '#171515', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Black',    '#171515', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Black',    '#171515', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Black',    '#171515', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Black',    '#171515', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Grey Marl','#9E9E9E', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Grey Marl','#9E9E9E', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Grey Marl','#9E9E9E', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Grey Marl','#9E9E9E', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Grey Marl','#9E9E9E', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Grey Marl','#9E9E9E', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Navy',     '#1B2A4A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Navy',     '#1B2A4A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Navy',     '#1B2A4A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Navy',     '#1B2A4A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Navy',     '#1B2A4A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Navy',     '#1B2A4A', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Burgundy', '#5B0E14', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Burgundy', '#5B0E14', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Burgundy', '#5B0E14', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Burgundy', '#5B0E14', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Burgundy', '#5B0E14', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Burgundy', '#5B0E14', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 15: Wool Overcoat — lowStockSizes: M,L available; XS,S,XL,XXL unavailable (stock_quantity=0)
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000015', 'Camel',    '#C19A6B', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Camel',    '#C19A6B', 'S',   0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Camel',    '#C19A6B', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Camel',    '#C19A6B', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Camel',    '#C19A6B', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Camel',    '#C19A6B', 'XXL', 0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Charcoal', '#3D3D3D', 'XS',  0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Charcoal', '#3D3D3D', 'S',   0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Charcoal', '#3D3D3D', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Charcoal', '#3D3D3D', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Charcoal', '#3D3D3D', 'XL',  0, TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Charcoal', '#3D3D3D', 'XXL', 0, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

-- Product 16: Straight Leg Denim — all 6 sizes available across 3 colours
INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES
  ('10000000-0000-0000-0000-000000000016', 'Dark Indigo','#1B2A4A', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Dark Indigo','#1B2A4A', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Dark Indigo','#1B2A4A', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Dark Indigo','#1B2A4A', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Dark Indigo','#1B2A4A', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Dark Indigo','#1B2A4A', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Mid Wash',   '#4A6FA5', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Mid Wash',   '#4A6FA5', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Mid Wash',   '#4A6FA5', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Mid Wash',   '#4A6FA5', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Mid Wash',   '#4A6FA5', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Mid Wash',   '#4A6FA5', 'XXL', 1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Black',      '#171515', 'XS',  1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Black',      '#171515', 'S',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Black',      '#171515', 'M',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Black',      '#171515', 'L',   1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Black',      '#171515', 'XL',  1, TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Black',      '#171515', 'XXL', 1, TRUE)
ON CONFLICT (product_id, colour, size) DO NOTHING;

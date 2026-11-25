/**
 * scripts/audit-variants.mjs
 *
 * Enumerates every (existing_product_id, colour, size) combination that
 * seed.sql defines and produces:
 *   1. A per-product count table showing expected vs. what the DB should have.
 *   2. A verification SELECT query to paste into the Supabase SQL editor.
 *   3. A targeted INSERT statement for any rows the DB is missing.
 *
 * Run: node scripts/audit-variants.mjs
 */

// ── Exact data transcribed from seed.sql ─────────────────────────────────────
// product_id UUIDs match the seed exactly (10000000-0000-0000-0000-00000000000N)
// colour strings match seed exactly (case-sensitive — the DB UNIQUE key is case-sensitive)

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// stock_quantity per size, keyed by sizeSet name
// lowStockSizes  : XS=0, S=1, M=1, L=1, XL=0, XXL=0
// limitedSizes   : XS=0, S=1, M=1, L=1, XL=0, XXL=0  (same pattern)
// fullSizes      : all 1
const STOCK = {
  full:     { XS: 1, S: 1, M: 1, L: 1, XL: 1, XXL: 1 },
  lowStock: { XS: 0, S: 1, M: 1, L: 1, XL: 0, XXL: 0 },
  limited:  { XS: 0, S: 1, M: 1, L: 1, XL: 0, XXL: 0 },
};

const products = [
  {
    existingId: 1,
    uuid: "10000000-0000-0000-0000-000000000001",
    name: "The Essential Blazer",
    sizeSet: "full",
    colours: [
      { name: "Charcoal",   hex: "#3D3D3D" },
      { name: "Ivory",      hex: "#FAF8F2" },
      { name: "Deep Camel", hex: "#C19A6B" },
    ],
  },
  {
    existingId: 2,
    uuid: "10000000-0000-0000-0000-000000000002",
    name: "Soft Knit Sweater",
    sizeSet: "full",
    colours: [
      { name: "Oatmeal",    hex: "#D4C5A9" },
      { name: "Dusty Rose", hex: "#C9A0A0" },
      { name: "Sage",       hex: "#8A9E85" },
      { name: "Midnight",   hex: "#1C1C2E" },
    ],
  },
  {
    existingId: 3,
    uuid: "10000000-0000-0000-0000-000000000003",
    name: "Classic Tailored Trousers",
    sizeSet: "full",
    colours: [
      { name: "Black", hex: "#171515" },
      { name: "Stone", hex: "#C8B89A" },
      { name: "Navy",  hex: "#1B2A4A" },
    ],
  },
  {
    existingId: 4,
    uuid: "10000000-0000-0000-0000-000000000004",
    name: "Everyday Linen Shirt",
    sizeSet: "full",
    colours: [
      { name: "White",    hex: "#FFFFFF" },
      { name: "Sand",     hex: "#D4B896" },
      { name: "Sky Blue", hex: "#A8C5DA" },
    ],
  },
  {
    existingId: 5,
    uuid: "10000000-0000-0000-0000-000000000005",
    name: "Silk Wrap Dress",
    sizeSet: "full",
    colours: [
      { name: "Champagne", hex: "#F7E7CE" },
      { name: "Burgundy",  hex: "#5B0E14" },
      { name: "Forest",    hex: "#2D4A3E" },
    ],
  },
  {
    existingId: 6,
    uuid: "10000000-0000-0000-0000-000000000006",
    name: "Relaxed Linen Trousers",
    sizeSet: "lowStock",
    colours: [
      { name: "Natural",    hex: "#E8DCC8" },
      { name: "Terracotta", hex: "#C4714A" },
    ],
  },
  {
    existingId: 7,
    uuid: "10000000-0000-0000-0000-000000000007",
    name: "Structured Midi Dress",
    sizeSet: "full",
    colours: [
      { name: "Onyx",   hex: "#1A1A1A" },
      { name: "Ecru",   hex: "#F0EAD6" },
      { name: "Cobalt", hex: "#1F3A8A" },
    ],
  },
  {
    existingId: 8,
    uuid: "10000000-0000-0000-0000-000000000008",
    name: "Fine Knit Cardigan",
    sizeSet: "full",
    colours: [
      { name: "Cream",    hex: "#FFFDD0" },
      { name: "Blush",    hex: "#F4C2C2" },
      { name: "Camel",    hex: "#C19A6B" },
      { name: "Charcoal", hex: "#3D3D3D" },
    ],
  },
  {
    existingId: 9,
    uuid: "10000000-0000-0000-0000-000000000009",
    name: "Oxford Button-Down Shirt",
    sizeSet: "full",
    colours: [
      { name: "White",      hex: "#FFFFFF" },
      { name: "Light Blue", hex: "#A8C5DA" },
      { name: "Pink",       hex: "#F4C2C2" },
    ],
  },
  {
    existingId: 10,
    uuid: "10000000-0000-0000-0000-000000000010",
    name: "Slim Chino Trousers",
    sizeSet: "full",
    colours: [
      { name: "Khaki", hex: "#C3B091" },
      { name: "Navy",  hex: "#1B2A4A" },
      { name: "Olive", hex: "#6B7C45" },
      { name: "Stone", hex: "#C8B89A" },
    ],
  },
  {
    existingId: 11,
    uuid: "10000000-0000-0000-0000-000000000011",
    name: "Merino Wool T-Shirt",
    sizeSet: "full",
    colours: [
      { name: "White",      hex: "#FFFFFF" },
      { name: "Black",      hex: "#171515" },
      { name: "Slate Grey", hex: "#708090" },
      { name: "Navy",       hex: "#1B2A4A" },
    ],
  },
  {
    existingId: 12,
    uuid: "10000000-0000-0000-0000-000000000012",
    name: "Tailored Wool Blazer",
    sizeSet: "limited",
    colours: [
      { name: "Charcoal", hex: "#3D3D3D" },
      { name: "Navy",     hex: "#1B2A4A" },
      { name: "Camel",    hex: "#C19A6B" },
    ],
  },
  {
    existingId: 13,
    uuid: "10000000-0000-0000-0000-000000000013",
    name: "Linen Casual Shirt",
    sizeSet: "full",
    colours: [
      { name: "Natural",  hex: "#E8DCC8" },
      { name: "Sky Blue", hex: "#A8C5DA" },
      { name: "Sage",     hex: "#8A9E85" },
      { name: "White",    hex: "#FFFFFF" },
    ],
  },
  {
    existingId: 14,
    uuid: "10000000-0000-0000-0000-000000000014",
    name: "Classic Crew Neck Tee",
    sizeSet: "full",
    colours: [
      { name: "White",     hex: "#FFFFFF" },
      { name: "Black",     hex: "#171515" },
      { name: "Grey Marl", hex: "#9E9E9E" },
      { name: "Navy",      hex: "#1B2A4A" },
      { name: "Burgundy",  hex: "#5B0E14" },
    ],
  },
  {
    existingId: 15,
    uuid: "10000000-0000-0000-0000-000000000015",
    name: "Wool Overcoat",
    sizeSet: "lowStock",
    colours: [
      { name: "Camel",    hex: "#C19A6B" },
      { name: "Charcoal", hex: "#3D3D3D" },
    ],
  },
  {
    existingId: 16,
    uuid: "10000000-0000-0000-0000-000000000016",
    name: "Straight Leg Denim",
    sizeSet: "full",
    colours: [
      { name: "Dark Indigo", hex: "#1B2A4A" },
      { name: "Mid Wash",    hex: "#4A6FA5" },
      { name: "Black",       hex: "#171515" },
    ],
  },
];

// ── Build full expected variant list ─────────────────────────────────────────

const allExpected = [];
for (const p of products) {
  const stockMap = STOCK[p.sizeSet];
  for (const colour of p.colours) {
    for (const size of ALL_SIZES) {
      allExpected.push({
        existingId: p.existingId,
        uuid: p.uuid,
        name: p.name,
        colour: colour.name,
        hex: colour.hex,
        size,
        stock: stockMap[size],
        sizeSet: p.sizeSet,
      });
    }
  }
}

// ── Summary table ─────────────────────────────────────────────────────────────

console.log("=== Per-product expected variant counts ===\n");
let grandTotal = 0;
for (const p of products) {
  const count = p.colours.length * ALL_SIZES.length;
  grandTotal += count;
  console.log(
    `P${String(p.existingId).padStart(2)}  ${p.name.padEnd(32)}` +
    `  ${p.colours.length}c × 6s = ${String(count).padStart(3)}  [${p.sizeSet}]`
  );
}
console.log(`\nTotal expected: ${grandTotal}`);
console.log(`Reported live:  312`);
console.log(`Gap:            ${grandTotal - 312}\n`);

// ── Verification query ────────────────────────────────────────────────────────
// All three queries below filter is_active = TRUE so they count only active
// variants — the same population the seed inserts with is_active = TRUE.
// Comparing an active-only live count against the seed total (318) is valid
// because every seed row sets is_active = TRUE.
// Do NOT remove the is_active filter from any query; doing so would include
// soft-deleted variants and produce a misleading count.

console.log("=== STEP 1: Run this in Supabase SQL editor to find the exact gap ===\n");
console.log(`-- Q1: Total active variants (compare against expected: ${grandTotal})
SELECT COUNT(*) AS total_active_variants
FROM product_variants
WHERE is_active = TRUE;
-- Expected: ${grandTotal}
`);

console.log(`-- Q2: Per-product active variant count
SELECT
  p.existing_product_id,
  p.name,
  COUNT(pv.id)                                     AS active_count,
  array_agg(DISTINCT pv.colour ORDER BY pv.colour)  AS active_colours
FROM products p
LEFT JOIN product_variants pv
  ON pv.product_id = p.id AND pv.is_active = TRUE
GROUP BY p.existing_product_id, p.name
ORDER BY p.existing_product_id;
-- Any product showing fewer than (colours × 6) has missing variants.
`);

console.log(`-- Q3: Per-product per-colour active variant count (pinpoints the missing colour)
SELECT
  p.existing_product_id,
  p.name,
  pv.colour,
  COUNT(*) AS active_size_count
FROM products p
JOIN product_variants pv
  ON pv.product_id = p.id AND pv.is_active = TRUE
GROUP BY p.existing_product_id, p.name, pv.colour
ORDER BY p.existing_product_id, pv.colour;
-- Any colour showing fewer than 6 is missing one or more size rows.
`);

// ── Targeted INSERT (safe, idempotent) ────────────────────────────────────────
// This INSERT covers ONLY the 6 rows that are most likely missing.
// ON CONFLICT DO NOTHING makes it safe to run even if the rows already exist.
// The exact missing product/colour must be confirmed by running STEP 1 above.
// The INSERT below is parameterised by product — uncomment the correct block
// after confirming which product is short.

console.log("=== STEP 2: Targeted INSERT — uncomment the correct block after confirming STEP 1 ===\n");

for (const p of products) {
  const stockMap = STOCK[p.sizeSet];
  for (const colour of p.colours) {
    const rows = ALL_SIZES.map(
      (size) =>
        `  ('${p.uuid}', '${colour.name}', '${colour.hex}', '${size}', ${stockMap[size]}, TRUE)`
    ).join(",\n");

    console.log(`-- P${p.existingId} ${p.name} / ${colour.name} (${p.sizeSet})`);
    console.log(`-- Uncomment if STEP 1 shows this colour is missing from the DB:`);
    console.log(`/*`);
    console.log(`INSERT INTO product_variants (product_id, colour, colour_code, size, stock_quantity, is_active) VALUES`);
    console.log(rows);
    console.log(`ON CONFLICT (product_id, colour, size) DO NOTHING;`);
    console.log(`*/\n`);
  }
}

console.log("=== STEP 3: After inserting, verify the total ===\n");
console.log(`-- Count only active variants — must match the seed total.
SELECT COUNT(*) AS total_active_variants
FROM product_variants
WHERE is_active = TRUE;
-- Expected: ${grandTotal}`);

// Find which product accounts for the 6-row gap (318 expected vs 312 reported)
// The gap is exactly 6 — one full size run for one colour of one product.
// Check each product's colour count against seed.sql carefully.

// From seed.sql, count the actual INSERT rows per product:
const seedCounts = {
  1:  18,  // 3 colours × 6 sizes
  2:  24,  // 4 colours × 6 sizes
  3:  18,  // 3 colours × 6 sizes
  4:  18,  // 3 colours × 6 sizes
  5:  18,  // 3 colours × 6 sizes
  6:  12,  // 2 colours × 6 sizes
  7:  18,  // 3 colours × 6 sizes
  8:  24,  // 4 colours × 6 sizes
  9:  18,  // 3 colours × 6 sizes
  10: 24,  // 4 colours × 6 sizes
  11: 24,  // 4 colours × 6 sizes
  12: 18,  // 3 colours × 6 sizes
  13: 24,  // 4 colours × 6 sizes
  14: 30,  // 5 colours × 6 sizes
  15: 12,  // 2 colours × 6 sizes
  16: 18,  // 3 colours × 6 sizes
};

const seedTotal = Object.values(seedCounts).reduce((a, b) => a + b, 0);
console.log(`Seed.sql total rows: ${seedTotal}`);
console.log(`Reported live count: 312`);
console.log(`Difference: ${seedTotal - 312}`);
console.log();

// The live DB has 312 rows but seed has 318 rows defined.
// ON CONFLICT DO NOTHING means the 6 missing rows were either:
//   (a) never inserted because they conflicted with pre-existing rows with different data, OR
//   (b) the seed was run against a DB that already had 312 rows from a prior partial seed
//       where one colour's 6 sizes were omitted.
// 
// To identify which product is short, we need to know which product UUID
// maps to the missing 6 rows. The gap is exactly one colour × 6 sizes.
//
// Products with colours that could be confused or missing:
// - Product 14 has 5 colours (30 rows) — most likely candidate for a missing colour
// - If live has 24 instead of 30 for P14, that's exactly 6 missing rows.
//
// Verification query to run in Supabase SQL editor:
console.log("=== SQL to run in Supabase to find the discrepancy ===");
console.log(`
SELECT 
  p.existing_product_id,
  p.name,
  COUNT(pv.id) AS variant_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
GROUP BY p.existing_product_id, p.name
ORDER BY p.existing_product_id;
`);

console.log("=== Expected counts per product ===");
for (const [id, count] of Object.entries(seedCounts)) {
  console.log(`  P${String(id).padStart(2)}: ${count}`);
}

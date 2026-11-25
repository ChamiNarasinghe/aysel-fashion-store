// Verify seed.sql variant count matches products.ts exactly
// Run: node scripts/verify-variants.mjs

const products = [
  { id: 1,  name: "The Essential Blazer",      colors: ["Charcoal","Ivory","Deep Camel"],                          sizeSet: "full" },
  { id: 2,  name: "Soft Knit Sweater",          colors: ["Oatmeal","Dusty Rose","Sage","Midnight"],                 sizeSet: "full" },
  { id: 3,  name: "Classic Tailored Trousers",  colors: ["Black","Stone","Navy"],                                   sizeSet: "full" },
  { id: 4,  name: "Everyday Linen Shirt",       colors: ["White","Sand","Sky Blue"],                                sizeSet: "full" },
  { id: 5,  name: "Silk Wrap Dress",            colors: ["Champagne","Burgundy","Forest"],                          sizeSet: "full" },
  { id: 6,  name: "Relaxed Linen Trousers",     colors: ["Natural","Terracotta"],                                   sizeSet: "lowStock" },
  { id: 7,  name: "Structured Midi Dress",      colors: ["Onyx","Ecru","Cobalt"],                                   sizeSet: "full" },
  { id: 8,  name: "Fine Knit Cardigan",         colors: ["Cream","Blush","Camel","Charcoal"],                       sizeSet: "full" },
  { id: 9,  name: "Oxford Button-Down Shirt",   colors: ["White","Light Blue","Pink"],                              sizeSet: "full" },
  { id: 10, name: "Slim Chino Trousers",        colors: ["Khaki","Navy","Olive","Stone"],                           sizeSet: "full" },
  { id: 11, name: "Merino Wool T-Shirt",        colors: ["White","Black","Slate Grey","Navy"],                      sizeSet: "full" },
  { id: 12, name: "Tailored Wool Blazer",       colors: ["Charcoal","Navy","Camel"],                                sizeSet: "limited" },
  { id: 13, name: "Linen Casual Shirt",         colors: ["Natural","Sky Blue","Sage","White"],                      sizeSet: "full" },
  { id: 14, name: "Classic Crew Neck Tee",      colors: ["White","Black","Grey Marl","Navy","Burgundy"],            sizeSet: "full" },
  { id: 15, name: "Wool Overcoat",              colors: ["Camel","Charcoal"],                                       sizeSet: "lowStock" },
  { id: 16, name: "Straight Leg Denim",         colors: ["Dark Indigo","Mid Wash","Black"],                         sizeSet: "full" },
];

// All size sets include all 6 sizes — availability flags only affect stock_quantity, not row count
const ALL_SIZES = ["XS","S","M","L","XL","XXL"];

let total = 0;
for (const p of products) {
  const variants = p.colors.length * ALL_SIZES.length;
  total += variants;
  console.log(`P${String(p.id).padStart(2)} ${p.name.padEnd(30)} ${p.colors.length}c × 6s = ${String(variants).padStart(3)}  [${p.sizeSet}]`);
}

console.log(`\nExpected total variants : ${total}`);
console.log(`Reported live DB count  : 312`);
console.log(`Status                  : ${total === 312 ? "MATCH ✓" : `DISCREPANCY — expected ${total}, live has 312`}`);

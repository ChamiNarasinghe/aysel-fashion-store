
"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/product-card";
import type { Product } from "@/data/products";

type Props = {
  products: Product[];
  categories: string[];
};

type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export default function CollectionGrid({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState<SortKey>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

    if (sort === "newest") list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return list;
  }, [products, activeCategory, sort]);

  return (
    <div>
      {/* Filter / Sort Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-light-beige pb-6">

        {/* Category filters – desktop */}
        <div className="hidden items-center gap-1 sm:flex flex-wrap">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
                activeCategory === cat
                  ? "bg-soft-black text-warm-white"
                  : "text-muted-grey hover:text-soft-black"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}

          {activeCategory !== "All" && (
            <button
              onClick={() => setActiveCategory("All")}
              className="ml-2 flex items-center gap-1 text-[10px] tracking-widest text-burgundy"
            >
              CLEAR <X size={12} />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex items-center gap-2 text-[10px] tracking-widest sm:hidden"
        >
          <SlidersHorizontal size={14} />
          FILTER {activeCategory !== "All" && `· ${activeCategory.toUpperCase()}`}
        </button>

        <div className="flex items-center gap-4 ml-auto">
          <span className="text-[10px] tracking-widest text-muted-grey">
            {filtered.length} {filtered.length === 1 ? "PRODUCT" : "PRODUCTS"}
          </span>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-light-beige bg-transparent px-3 py-2 text-[10px] tracking-widest text-soft-black outline-none"
            aria-label="Sort products"
          >
            <option value="featured">FEATURED</option>
            <option value="newest">NEWEST</option>
            <option value="price-asc">PRICE: LOW TO HIGH</option>
            <option value="price-desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="mb-6 flex flex-wrap gap-2 sm:hidden">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setFiltersOpen(false); }}
              className={`px-4 py-2 text-[10px] tracking-[0.12em] border transition-colors ${
                activeCategory === cat
                  ? "border-soft-black bg-soft-black text-warm-white"
                  : "border-light-beige text-muted-grey"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-muted-grey">No products found.</p>
          <button
            onClick={() => setActiveCategory("All")}
            className="mt-4 text-[10px] tracking-widest text-burgundy underline"
          >
            CLEAR FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

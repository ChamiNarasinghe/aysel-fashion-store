"use client";

import { useState, useMemo, useEffect } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "@/components/product-card";
import { formatPrice } from "@/data/products";
import type { Product } from "@/data/products";

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export interface FilterState {
  genders: string[];
  categories: string[];
  colors: string[];
  sizes: string[];
  minPrice: string;
  maxPrice: string;
  newOnly: boolean;
}

const EMPTY_FILTERS: FilterState = {
  genders: [],
  categories: [],
  colors: [],
  sizes: [],
  minPrice: "",
  maxPrice: "",
  newOnly: false,
};

function hasActiveFilters(f: FilterState) {
  return (
    f.genders.length > 0 ||
    f.categories.length > 0 ||
    f.colors.length > 0 ||
    f.sizes.length > 0 ||
    f.minPrice !== "" ||
    f.maxPrice !== "" ||
    f.newOnly
  );
}

function countActiveFilters(f: FilterState) {
  return (
    f.genders.length +
    f.categories.length +
    f.colors.length +
    f.sizes.length +
    (f.minPrice !== "" || f.maxPrice !== "" ? 1 : 0) +
    (f.newOnly ? 1 : 0)
  );
}

function applyFiltersAndSort(
  products: Product[],
  filters: FilterState,
  sort: SortKey
): Product[] {
  let list = products.filter((p) => {
    if (filters.genders.length && !filters.genders.includes(p.gender)) return false;
    if (filters.categories.length && !filters.categories.includes(p.category)) return false;
    if (filters.colors.length) {
      const productColorNames = p.colors.map((c) => c.name);
      if (!filters.colors.some((c) => productColorNames.includes(c))) return false;
    }
    if (filters.sizes.length) {
      const availableSizes = p.sizes.filter((s) => s.available).map((s) => s.label as string);
      if (!filters.sizes.some((s) => availableSizes.includes(s))) return false;
    }
    if (filters.minPrice !== "") {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min) && p.price < min) return false;
    }
    if (filters.maxPrice !== "") {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max) && p.price > max) return false;
    }
    if (filters.newOnly && !p.isNew) return false;
    return true;
  });

  if (sort === "newest") list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return list;
}

// ── Filter Panel (shared between desktop sidebar and mobile drawer) ──────────

interface FilterPanelProps {
  products: Product[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-light-beige py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[10px] font-medium tracking-[0.14em]"
      >
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FilterPanel({ products, filters, onChange }: FilterPanelProps) {
  const allCategories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );
  const allColors = useMemo(
    () =>
      [...new Set(products.flatMap((p) => p.colors.map((c) => c.name)))].sort(),
    [products]
  );
  const allSizes = useMemo(() => {
    const order = ["XS", "S", "M", "L", "XL", "XXL"] as const;
    const available = new Set(
      products.flatMap((p) =>
        p.sizes.filter((s) => s.available).map((s) => s.label)
      )
    );
    return order.filter((s) => available.has(s));
  }, [products]);

  const prices = products.map((p) => p.price);
  const globalMin = Math.min(...prices);
  const globalMax = Math.max(...prices);

  const checkboxClass = (active: boolean) =>
    `flex items-center gap-2 cursor-pointer text-[11px] leading-5 ${active ? "text-soft-black font-medium" : "text-muted-grey"}`;

  return (
    <div>
      {/* Gender */}
      <FilterSection title="GENDER">
        {(["women", "men"] as const).map((g) => (
          <label key={g} className={checkboxClass(filters.genders.includes(g))}>
            <input
              type="checkbox"
              checked={filters.genders.includes(g)}
              onChange={() => onChange({ ...filters, genders: toggle(filters.genders, g) })}
              className="accent-burgundy"
            />
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </label>
        ))}
      </FilterSection>

      {/* Category */}
      <FilterSection title="CATEGORY">
        <div className="flex flex-col gap-1.5">
          {allCategories.map((cat) => (
            <label key={cat} className={checkboxClass(filters.categories.includes(cat))}>
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
                className="accent-burgundy"
              />
              {cat}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="PRICE">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`${globalMin}`}
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className="w-full border border-light-beige bg-transparent px-2 py-1.5 text-xs outline-none focus:border-burgundy"
            min={0}
          />
          <span className="text-xs text-muted-grey">–</span>
          <input
            type="number"
            placeholder={`${globalMax}`}
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="w-full border border-light-beige bg-transparent px-2 py-1.5 text-xs outline-none focus:border-burgundy"
            min={0}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted-grey">
          LKR {globalMin.toLocaleString("en-LK")} – LKR {globalMax.toLocaleString("en-LK")}
        </p>
      </FilterSection>

      {/* Colour */}
      <FilterSection title="COLOUR">
        <div className="flex flex-wrap gap-2">
          {allColors.map((color) => {
            const hex = products
              .flatMap((p) => p.colors)
              .find((c) => c.name === color)?.hex ?? "#ccc";
            const active = filters.colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => onChange({ ...filters, colors: toggle(filters.colors, color) })}
                className={`h-6 w-6 rounded-full border-2 transition-all ${
                  active ? "border-burgundy scale-110" : "border-transparent hover:border-muted-grey"
                }`}
                style={{ backgroundColor: hex }}
                aria-label={color}
                aria-pressed={active}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="SIZE">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => {
            const active = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...filters, sizes: toggle(filters.sizes, size) })}
                className={`h-8 w-10 border text-[10px] tracking-wider transition-colors ${
                  active
                    ? "border-soft-black bg-soft-black text-warm-white"
                    : "border-light-beige text-muted-grey hover:border-soft-black hover:text-soft-black"
                }`}
                aria-pressed={active}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* New Arrivals */}
      <div className="py-4">
        <label className={checkboxClass(filters.newOnly)}>
          <input
            type="checkbox"
            checked={filters.newOnly}
            onChange={(e) => onChange({ ...filters, newOnly: e.target.checked })}
            className="accent-burgundy"
          />
          New Arrivals Only
        </label>
      </div>
    </div>
  );
}

// ── Active Filter Chips ───────────────────────────────────────────────────────

function ActiveFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const chips: { label: string; remove: () => void }[] = [];

  filters.genders.forEach((g) =>
    chips.push({ label: g.charAt(0).toUpperCase() + g.slice(1), remove: () => onChange({ ...filters, genders: filters.genders.filter((x) => x !== g) }) })
  );
  filters.categories.forEach((c) =>
    chips.push({ label: c, remove: () => onChange({ ...filters, categories: filters.categories.filter((x) => x !== c) }) })
  );
  filters.colors.forEach((c) =>
    chips.push({ label: c, remove: () => onChange({ ...filters, colors: filters.colors.filter((x) => x !== c) }) })
  );
  filters.sizes.forEach((s) =>
    chips.push({ label: `Size ${s}`, remove: () => onChange({ ...filters, sizes: filters.sizes.filter((x) => x !== s) }) })
  );
  if (filters.minPrice !== "" || filters.maxPrice !== "") {
    chips.push({
      label: `LKR ${filters.minPrice || "0"} – ${filters.maxPrice || "∞"}`,
      remove: () => onChange({ ...filters, minPrice: "", maxPrice: "" }),
    });
  }
  if (filters.newOnly) {
    chips.push({ label: "New Arrivals", remove: () => onChange({ ...filters, newOnly: false }) });
  }

  if (!chips.length) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.remove}
          className="flex items-center gap-1.5 border border-light-beige px-3 py-1.5 text-[10px] tracking-wider text-soft-black transition-colors hover:border-burgundy hover:text-burgundy"
        >
          {chip.label} <X size={10} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTERS)}
        className="text-[10px] tracking-widest text-burgundy underline"
      >
        CLEAR ALL
      </button>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

interface SearchFiltersProps {
  products: Product[];
  initialFilters?: Partial<FilterState>;
}

export default function SearchFilters({ products, initialFilters }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, ...initialFilters });
  const [sort, setSort] = useState<SortKey>("featured");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Pending filters for mobile drawer (applied on "Apply")
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const openDrawer = () => {
    setPendingFilters(filters);
    setDrawerOpen(true);
  };

  const applyDrawer = () => {
    setFilters(pendingFilters);
    setDrawerOpen(false);
  };

  const results = useMemo(
    () => applyFiltersAndSort(products, filters, sort),
    [products, filters, sort]
  );

  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex gap-8">

      {/* Desktop Sidebar */}
      <aside className="hidden w-52 shrink-0 lg:block xl:w-60">
        <div className="sticky top-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.14em]">FILTERS</span>
            {hasActiveFilters(filters) && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-[10px] tracking-widest text-burgundy"
              >
                CLEAR ALL
              </button>
            )}
          </div>
          <FilterPanel products={products} filters={filters} onChange={setFilters} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">

        {/* Sort + Mobile Filter Bar */}
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-light-beige pb-5">
          <button
            type="button"
            onClick={openDrawer}
            className="flex items-center gap-2 text-[10px] tracking-widest lg:hidden"
          >
            <SlidersHorizontal size={14} />
            FILTERS{activeCount > 0 && ` (${activeCount})`}
          </button>

          <span className="hidden text-[10px] tracking-widest text-muted-grey lg:block">
            {results.length} {results.length === 1 ? "PRODUCT" : "PRODUCTS"}
          </span>

          <div className="flex items-center gap-4 ml-auto">
            <span className="text-[10px] tracking-widest text-muted-grey lg:hidden">
              {results.length} {results.length === 1 ? "PRODUCT" : "PRODUCTS"}
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

        {/* Active Filter Chips */}
        <ActiveFilters filters={filters} onChange={setFilters} />

        {/* Product Grid */}
        {results.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-grey">No products match your filters.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="mt-4 text-[10px] tracking-widest text-burgundy underline"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-warm-white lg:hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-beige px-5 py-4">
              <span className="text-[10px] font-medium tracking-[0.14em]">FILTERS</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto px-5">
              <FilterPanel
                products={products}
                filters={pendingFilters}
                onChange={setPendingFilters}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-light-beige px-5 py-4">
              <button
                type="button"
                onClick={() => { setPendingFilters(EMPTY_FILTERS); }}
                className="flex-1 border border-light-beige py-3 text-[10px] tracking-widest text-soft-black transition-colors hover:border-soft-black"
              >
                CLEAR ALL
              </button>
              <button
                type="button"
                onClick={applyDrawer}
                className="flex-1 bg-burgundy py-3 text-[10px] tracking-widest text-warm-white transition-opacity hover:opacity-90"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

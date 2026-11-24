import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products } from "@/data/products";
import SearchFilters from "@/components/search-filters";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
  };
}

function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const matched = searchProducts(query);

  if (!query) {
    return (
      <div className="min-h-[60vh] bg-warm-white px-5 py-24 text-center sm:px-10">
        <p className="text-[10px] tracking-[0.25em] text-burgundy">SEARCH</p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-5xl">
          What are you looking for?
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-muted-grey">
          Use the search bar above to find products by name or description.
        </p>
        <Link
          href="/collections"
          className="mt-8 inline-flex items-center gap-3 border border-soft-black px-7 py-3 text-[10px] tracking-widest transition-colors hover:bg-soft-black hover:text-warm-white"
        >
          BROWSE COLLECTIONS <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  if (matched.length === 0) {
    return (
      <div className="min-h-[60vh] bg-warm-white px-5 py-24 text-center sm:px-10">
        <p className="text-[10px] tracking-[0.25em] text-burgundy">SEARCH RESULTS</p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-5xl">
          No results found
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-muted-grey">
          We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try a different term or browse our collections.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/collections"
            className="inline-flex items-center gap-3 border border-soft-black px-7 py-3 text-[10px] tracking-widest transition-colors hover:bg-soft-black hover:text-warm-white"
          >
            BROWSE COLLECTIONS <ArrowRight size={13} />
          </Link>
          <Link
            href="/collections/new-arrivals"
            className="inline-flex items-center gap-3 bg-burgundy px-7 py-3 text-[10px] tracking-widest text-warm-white transition-opacity hover:opacity-90"
          >
            NEW ARRIVALS <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-warm-white">
      {/* Page Header */}
      <div className="border-b border-light-beige px-5 py-12 sm:px-10 lg:px-16">
        <p className="text-[10px] tracking-[0.25em] text-burgundy">SEARCH RESULTS</p>
        <h1 className="mt-3 font-display text-3xl text-soft-black sm:text-4xl">
          &ldquo;{query}&rdquo;
        </h1>
        <p className="mt-2 text-xs text-muted-grey">
          {matched.length} {matched.length === 1 ? "product" : "products"} found
        </p>
      </div>

      {/* Filters + Grid */}
      <div className="px-5 py-10 sm:px-10 lg:px-16">
        <SearchFilters products={matched} />
      </div>
    </div>
  );
}

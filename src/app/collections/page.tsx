
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ProductCard from "@/components/product-card";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Collections",
  description: "Discover the full AYSEL collection — Women, Men and New Arrivals.",
};

const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

export default function CollectionsPage() {
  return (
    <div className="bg-warm-white">

      {/* Hero */}
      <section className="px-6 py-20 text-center sm:py-28">
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          THE WORLD OF AYSEL
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-tight text-soft-black sm:text-6xl lg:text-7xl">
          Discover Your Style
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-xs leading-7 text-muted-grey sm:text-sm">
          Explore our carefully curated collections — contemporary pieces
          designed to make everyday style feel timeless and effortlessly yours.
        </p>
      </section>

      {/* Category Cards */}
      <section className="px-5 pb-20 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Link
            href="/collections/women"
            className="group relative aspect-[4/5] overflow-hidden bg-light-beige"
          >
            <Image
              src="/images/category-women.jpg"
              alt="Women's fashion collection"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/30" />
            <div className="absolute bottom-8 left-8 text-white">
              <p className="text-[9px] tracking-[0.25em]">DISCOVER YOUR STYLE</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">WOMEN</h2>
              <span className="mt-5 inline-flex items-center gap-3 border-b border-white pb-2 text-[10px] tracking-widest">
                SHOP NOW <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link
            href="/collections/men"
            className="group relative aspect-[4/5] overflow-hidden bg-light-beige"
          >
            <Image
              src="/images/category-men.jpg"
              alt="Men's fashion collection"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/30" />
            <div className="absolute bottom-8 left-8 text-white">
              <p className="text-[9px] tracking-[0.25em]">REDEFINE EVERYDAY ESSENTIALS</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">MEN</h2>
              <span className="mt-5 inline-flex items-center gap-3 border-b border-white pb-2 text-[10px] tracking-widest">
                SHOP NOW <ArrowRight size={14} />
              </span>
            </div>
          </Link>

        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-[#F3EFE6] px-5 py-20 sm:px-10 lg:px-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-burgundy">JUST ARRIVED</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">New Arrivals</h2>
            <p className="mt-3 text-xs text-muted-grey">The latest additions to AYSEL.</p>
          </div>
          <Link
            href="/collections/new-arrivals"
            className="flex items-center gap-2 text-[9px] tracking-widest sm:text-xs"
          >
            VIEW ALL <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="relative h-[480px] overflow-hidden bg-burgundy sm:h-[560px]">
        <Image
          src="/images/featured-collection.jpg"
          alt="AYSEL featured collection"
          fill
          sizes="100vw"
          className="object-cover object-[70%_15%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-burgundy/85 via-burgundy/30 to-transparent" />
        <div className="relative z-10 flex h-full items-center px-7 sm:px-16 lg:px-24">
          <div className="max-w-lg text-golden-sand">
            <p className="text-[10px] tracking-[0.3em]">THE AYSEL EDIT</p>
            <h2 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">
              The art of<br />everyday style.
            </h2>
            <p className="mt-6 max-w-sm text-xs leading-7 text-white/85 sm:text-sm">
              Thoughtful details. Beautiful silhouettes.
              Pieces that stay with you beyond the season.
            </p>
            <Link
              href="/collections/women"
              className="btn-featured mt-9 inline-flex items-center gap-4 border border-golden-sand bg-transparent px-7 py-4 text-[10px] tracking-[0.2em] text-golden-sand transition-all duration-300 hover:bg-golden-sand"
            >
              SHOP THE EDIT <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

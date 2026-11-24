
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import ProductCard from "@/components/product-card";
import { newArrivals } from "@/data/products";

const categories = [
  {
    title: "WOMEN",
    subtitle: "Discover your style",
    image: "/images/category-women.jpg",
    href: "/collections/women",
  },
  {
    title: "MEN",
    subtitle: "Redefine everyday essentials",
    image: "/images/category-men.jpg",
    href: "/collections/men",
  },
];

export default function Home() {
  return (
    <div className="bg-warm-white">

      {/* 01. HERO CAMPAIGN */}
      <section className="relative h-[720px] overflow-hidden bg-light-beige sm:h-[800px] lg:h-[min(860px,85vh)]">

        <Image
          src="/images/hero-campaign.jpg"
          alt="AYSEL contemporary fashion campaign"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_20%]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

        <div className="relative z-10 flex h-[720px] items-center px-6 sm:h-[800px] sm:px-12 lg:px-20">

          <div className="max-w-xl text-white">

            <p className="mb-7 text-[10px] tracking-[0.35em] sm:text-xs">
              THE NEW COLLECTION · 2026
            </p>

            <h1 className="font-display text-5xl leading-[1.1] sm:text-7xl lg:text-8xl">
              A style
              <br />
              of your own.
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/85">
              Discover thoughtfully curated pieces
              designed to make everyday style timeless.
            </p>

            <Link
              href="/collections"
              className="mt-9 inline-flex items-center gap-5 bg-golden-sand px-8 py-4 text-[10px] tracking-[0.2em] text-burgundy transition-all duration-300 hover:bg-burgundy hover:text-golden-sand"
            >
              EXPLORE THE COLLECTION
              <ArrowRight size={16} />
            </Link>

          </div>
        </div>

        <div className="absolute bottom-7 right-8 z-10 hidden text-[9px] tracking-[0.25em] text-white/80 sm:block">
          AYSEL — CONTEMPORARY FASHION
        </div>
      </section>

      {/* 02. BRAND INTRODUCTION */}
      <section className="px-6 py-16 text-center sm:py-24">

        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          THE WORLD OF AYSEL
        </p>

        <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl leading-tight text-soft-black sm:text-5xl lg:text-6xl">
          Fashion is an expression
          <br className="hidden sm:block" />
          of who you are.
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-xs leading-7 text-muted-grey sm:text-sm">
          Discover contemporary pieces, timeless essentials
          and thoughtful details. A wardrobe that reflects
          your individuality.
        </p>
      </section>

      {/* 03. SHOP BY CATEGORY */}
      <section className="px-5 pb-20 sm:px-10 lg:px-16">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-burgundy">
              FIND YOUR STYLE
            </p>

            <h2 className="mt-3 font-display text-3xl sm:text-4xl">
              Explore collections
            </h2>
          </div>

          <Link
            href="/collections"
            className="hidden items-center gap-2 text-[10px] tracking-widest sm:flex"
          >
            VIEW ALL <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {categories.map((category) => (
            <Link
              href={category.href}
              key={category.title}
              className="group relative aspect-[4/5] overflow-hidden bg-light-beige"
            >

              <Image
                src={category.image}
                alt={`${category.title} fashion collection`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/30" />

              <div className="absolute bottom-8 left-8 text-white">

                <p className="text-[9px] tracking-[0.25em]">
                  {category.subtitle.toUpperCase()}
                </p>

                <h3 className="mt-2 font-display text-4xl sm:text-5xl">
                  {category.title}
                </h3>

                <span className="mt-5 inline-flex items-center gap-3 border-b border-white pb-2 text-[10px] tracking-widest">
                  EXPLORE NOW
                  <ArrowRight size={14} />
                </span>

              </div>
            </Link>
          ))}

        </div>
      </section>

      {/* 04. NEW ARRIVALS */}
      <section className="bg-[#F3EFE6] px-5 py-20 sm:px-10 lg:px-16">

        <div className="mb-10 flex items-end justify-between">

          <div>
            <p className="text-[9px] tracking-[0.25em] text-burgundy">
              JUST ARRIVED
            </p>

            <h2 className="mt-3 font-display text-3xl sm:text-5xl">
              New arrivals
            </h2>

            <p className="mt-3 text-xs text-muted-grey">
              Discover the latest additions to AYSEL.
            </p>
          </div>

          <Link
            href="/collections/new-arrivals"
            className="flex items-center gap-2 text-[9px] tracking-widest sm:text-xs"
          >
            VIEW ALL
            <ArrowUpRight size={14} />
          </Link>

        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">

          {newArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}

        </div>
      </section>

      {/* 05. FEATURED COLLECTION */}
      <section className="relative h-[480px] overflow-hidden bg-burgundy sm:h-[580px] lg:h-[620px]">

        <Image
          src="/images/featured-collection.jpg"
          alt="AYSEL featured fashion collection"
          fill
          sizes="100vw"
          className="object-cover object-[70%_15%]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-burgundy/85 via-burgundy/30 to-transparent" />

        <div className="relative z-10 flex h-[480px] items-center px-7 sm:h-[580px] sm:px-16 lg:px-24">

          <div className="max-w-lg text-golden-sand">

            <p className="text-[10px] tracking-[0.3em]">
              THE AYSEL EDIT
            </p>

            <h2 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">
              The art of
              <br />
              everyday style.
            </h2>

            <p className="mt-6 max-w-sm text-xs leading-7 text-white/85 sm:text-sm">
              Thoughtful details. Beautiful silhouettes.
              Pieces that stay with you beyond the season.
            </p>

            <Link
              href="/collections"
              className="btn-featured mt-9 inline-flex items-center gap-4 border border-golden-sand bg-transparent px-7 py-4 text-[10px] tracking-[0.2em] text-golden-sand transition-all duration-300 hover:bg-golden-sand"
            >
              DISCOVER THE COLLECTION
              <ArrowRight size={15} />
            </Link>

          </div>
        </div>
      </section>

      {/* 06. BRAND STORY */}
      <section className="px-6 py-20 text-center sm:py-28">

        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          MORE THAN FASHION
        </p>

        <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
          Style without boundaries.
          <br />
          Confidence without limits.
        </h2>

        <p className="mx-auto mt-6 max-w-lg text-xs leading-7 text-muted-grey sm:text-sm">
          AYSEL celebrates individuality through
          contemporary fashion and carefully considered
          collections. Find pieces that feel like you.
        </p>

        <Link
          href="/about"
          className="mt-9 inline-flex items-center gap-3 border-b border-burgundy pb-2 text-[10px] tracking-[0.2em] text-burgundy"
        >
          DISCOVER OUR STORY
          <ArrowUpRight size={15} />
        </Link>

      </section>

    </div>
  );
}


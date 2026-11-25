
import type { Metadata } from "next";
import Image from "next/image";
import { products } from "@/data/products";
import CollectionGrid from "@/components/collection-grid";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "Discover the latest additions to AYSEL — new season pieces just arrived.",
};

const newProducts = products.filter((p) => p.isNew);
const categories = [...new Set(newProducts.map((p) => p.category))];

export default function NewArrivalsPage() {
  return (
    <div className="bg-warm-white">

      {/* Editorial Banner */}
      <section className="relative h-[420px] overflow-hidden bg-light-beige sm:h-[520px]" style={{ position: "relative" }}>
        <Image
          src="/images/hero-campaign.jpg"
          alt="AYSEL New Arrivals"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        <div className="relative z-10 flex h-full items-end px-6 pb-12 sm:px-12 lg:px-20">
          <div className="text-white">
            <p className="text-[10px] tracking-[0.3em]">JUST ARRIVED · 2026</p>
            <h1 className="mt-3 font-display text-5xl sm:text-7xl">
              New Arrivals
            </h1>
          </div>
        </div>
      </section>

      {/* Collection Content */}
      <section className="px-5 py-14 sm:px-10 lg:px-16">
        <div className="mb-10">
          <p className="text-xs leading-7 text-muted-grey max-w-xl">
            The latest additions to AYSEL. Fresh pieces from our new season
            collection, available now.
          </p>
        </div>

        <CollectionGrid products={newProducts} categories={categories} />
      </section>

    </div>
  );
}


import type { Metadata } from "next";
import Image from "next/image";
import { products } from "@/data/products";
import CollectionGrid from "@/components/collection-grid";

export const metadata: Metadata = {
  title: "Women's Collection",
  description: "Shop the AYSEL Women's Collection — dresses, tops, shirts, trousers and outerwear.",
};

const womenProducts = products.filter((p) => p.gender === "women");
const categories = ["Dresses", "Tops", "Shirts", "Trousers", "Outerwear"];

export default function WomenCollectionPage() {
  return (
    <div className="bg-warm-white">

      {/* Editorial Banner */}
      <section className="relative h-[420px] overflow-hidden bg-light-beige sm:h-[520px]" style={{ position: "relative" }}>
        <Image
          src="/images/category-women.jpg"
          alt="AYSEL Women's Collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 flex h-full items-end px-6 pb-12 sm:px-12 lg:px-20">
          <div className="text-white">
            <p className="text-[10px] tracking-[0.3em]">AYSEL · 2026</p>
            <h1 className="mt-3 font-display text-5xl sm:text-7xl">
              Women&apos;s Collection
            </h1>
          </div>
        </div>
      </section>

      {/* Collection Content */}
      <section className="px-5 py-14 sm:px-10 lg:px-16">
        <div className="mb-10">
          <p className="text-xs leading-7 text-muted-grey max-w-xl">
            Discover contemporary pieces crafted for the modern woman.
            From effortless everyday essentials to refined occasion wear.
          </p>
        </div>

        <CollectionGrid products={womenProducts} categories={categories} />
      </section>

    </div>
  );
}

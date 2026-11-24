import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { products } from "@/data/products";
import ProductDetailClient from "@/components/product/product-detail-client";
import RelatedProducts from "@/components/product/related-products";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);

  if (!product) notFound();

  const collectionHref =
    product.gender === "women"
      ? "/collections/women"
      : product.gender === "men"
      ? "/collections/men"
      : "/collections";

  const collectionLabel =
    product.gender === "women" ? "Women" : product.gender === "men" ? "Men" : "Collections";

  return (
    <div className="bg-warm-white">

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1 overflow-hidden px-5 py-4 text-[10px] tracking-[0.12em] text-muted-grey sm:px-10 lg:px-16"
      >
        <Link href="/" className="shrink-0 transition-colors hover:text-soft-black">
          Home
        </Link>
        <ChevronRight size={11} className="shrink-0 opacity-50" />
        <Link href={collectionHref} className="shrink-0 transition-colors hover:text-soft-black">
          {collectionLabel}
        </Link>
        <ChevronRight size={11} className="shrink-0 opacity-50" />
        <Link
          href={collectionHref}
          className="shrink-0 transition-colors hover:text-soft-black"
        >
          {product.category}
        </Link>
        <ChevronRight size={11} className="shrink-0 opacity-50" />
        <span className="min-w-0 truncate text-soft-black">{product.name}</span>
      </nav>

      {/* Product Detail */}
      <ProductDetailClient product={product} />

      {/* Related Products */}
      <RelatedProducts current={product} />

    </div>
  );
}

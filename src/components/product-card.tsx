"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useWishlistStore } from "@/stores/wishlist-store";

export default function ProductCard({ product }: { product: Product }) {
  const { toggle, has } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  // Prevent SSR/hydration mismatch — wishlist state is client-only
  useEffect(() => {
    useWishlistStore.persist.rehydrate();
    setMounted(true);
  }, []);

  const wishlisted = mounted && has(product.id);

  return (
    <article className="group min-w-0">

      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-light-beige">

        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {product.badge && (
          <span className="absolute left-3 top-3 bg-warm-white px-3 py-1 text-[9px] tracking-widest">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 transition-colors hover:bg-burgundy hover:text-white"
        >
          <Heart
            size={17}
            strokeWidth={1.5}
            className={wishlisted ? "fill-burgundy text-burgundy" : ""}
          />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 py-4">
        <p className="text-[9px] tracking-[0.16em] text-muted-grey">
          {product.category.toUpperCase()}
        </p>

        <Link
          href={`/products/${product.slug}`}
          className="text-xs font-medium text-soft-black transition-colors hover:text-burgundy sm:text-sm"
        >
          {product.name}
        </Link>

        <p className="text-xs font-medium text-burgundy">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { useGuestWishlistStore } from "@/stores/guest-wishlist-store";
import { useStoreReadiness } from "@/providers/store-provider";
import { products, formatPrice } from "@/data/products";

export default function WishlistPage() {
  const { items, toggle } = useGuestWishlistStore();
  const { ready, migrationError } = useStoreReadiness();

  if (!ready) {
    return <div className="min-h-[60vh] bg-warm-white" aria-hidden="true" />;
  }

  if (migrationError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-warm-white px-5 py-24 text-center">
        <Heart size={48} strokeWidth={1} className="text-burgundy" />
        <h1 className="mt-6 font-display text-3xl text-soft-black sm:text-4xl">
          Your wishlist couldn&apos;t be loaded
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-grey">
          We ran into a problem loading your wishlist. Your saved pieces are
          safe and have not been deleted. Please refresh the page to try again,
          or contact us if the problem persists.
        </p>
        <p className="mt-3 rounded border border-light-beige bg-light-beige/40 px-4 py-2 text-[10px] tracking-wider text-muted-grey">
          {migrationError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex items-center gap-3 bg-burgundy px-8 py-4 text-[10px] tracking-[0.2em] text-warm-white transition-opacity hover:opacity-90"
        >
          REFRESH PAGE
        </button>
      </div>
    );
  }

  const wishlistProductIds = new Set(items.map((i) => i.productId));
  const wishlistProducts = products.filter((p) => wishlistProductIds.has(p.id));

  // ── Empty state ────────────────────────────────────────────────────────────
  if (wishlistProducts.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-warm-white px-5 py-24 text-center">
        <Heart size={48} strokeWidth={1} className="text-light-beige" />
        <h1 className="mt-6 font-display text-3xl text-soft-black sm:text-4xl">
          Your wishlist is waiting.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-grey">
          Save your favourite pieces here and come back whenever you&apos;re
          ready to make them yours.
        </p>
        <Link
          href="/collections"
          className="mt-8 inline-flex items-center gap-3 bg-burgundy px-8 py-4 text-[10px] tracking-[0.2em] text-warm-white transition-opacity hover:opacity-90"
        >
          CONTINUE SHOPPING <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-warm-white">
      {/* Page header */}
      <div className="border-b border-light-beige px-5 py-10 sm:px-10 lg:px-16">
        <p className="text-[10px] tracking-[0.25em] text-burgundy">AYSEL</p>
        <h1 className="mt-2 font-display text-3xl text-soft-black sm:text-4xl">
          My Wishlist
        </h1>
        <p className="mt-1 text-xs text-muted-grey">
          {wishlistProducts.length}{" "}
          {wishlistProducts.length === 1 ? "saved piece" : "saved pieces"}
        </p>
      </div>

      <div className="px-5 py-10 sm:px-10 lg:px-16">
        {/* Product grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {wishlistProducts.map((product) => {
            const isOutOfStock = product.availability === "out-of-stock";

            return (
              <article key={product.id} className="group min-w-0">
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-light-beige" style={{ position: "relative" }}>
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

                  {isOutOfStock && (
                    <span className="absolute left-3 top-3 bg-soft-black px-3 py-1 text-[9px] tracking-widest text-warm-white">
                      SOLD OUT
                    </span>
                  )}

                  {/* Remove from wishlist */}
                  <button
                    type="button"
                    onClick={() => toggle(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 transition-colors hover:bg-burgundy hover:text-warm-white"
                  >
                    <Heart
                      size={17}
                      strokeWidth={1.5}
                      className="fill-burgundy text-burgundy"
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

                  {/* Add to Bag — links to PDP since size selection is required */}
                  <Link
                    href={`/products/${product.slug}`}
                    aria-label={
                      isOutOfStock
                        ? `${product.name} is out of stock`
                        : `Select options for ${product.name}`
                    }
                    className={`mt-1 flex h-10 w-full items-center justify-center gap-2 text-[10px] tracking-[0.15em] transition-all duration-300 ${
                      isOutOfStock
                        ? "cursor-not-allowed border border-light-beige text-muted-grey"
                        : "border border-soft-black text-soft-black hover:bg-soft-black hover:text-warm-white"
                    }`}
                    onClick={(e) => {
                      if (isOutOfStock) e.preventDefault();
                    }}
                  >
                    <ShoppingBag size={13} strokeWidth={1.5} />
                    {isOutOfStock ? "OUT OF STOCK" : "SELECT OPTIONS"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Continue shopping */}
        <div className="mt-12 border-t border-light-beige pt-8 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center gap-3 text-[10px] tracking-widest text-muted-grey transition-colors hover:text-soft-black"
          >
            ← CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useGuestCartStore } from "@/stores/guest-cart-store";
import { useStoreReadiness } from "@/providers/store-provider";
import { products, formatPrice } from "@/data/products";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } =
    useGuestCartStore();
  const { ready, migrationError } = useStoreReadiness();

  if (!ready) {
    return <div className="min-h-[60vh] bg-warm-white" aria-hidden="true" />;
  }

  if (migrationError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-warm-white px-5 py-24 text-center">
        <ShoppingBag size={48} strokeWidth={1} className="text-burgundy" />
        <h1 className="mt-6 font-display text-3xl text-soft-black sm:text-4xl">
          Your bag couldn&apos;t be loaded
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-grey">
          We ran into a problem loading your shopping bag. Your items are safe
          and have not been deleted. Please refresh the page to try again, or
          contact us if the problem persists.
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

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-warm-white px-5 py-24 text-center">
        <ShoppingBag size={48} strokeWidth={1} className="text-light-beige" />
        <h1 className="mt-6 font-display text-3xl text-soft-black sm:text-4xl">
          Your bag is empty
        </h1>
        <p className="mt-3 text-sm text-muted-grey">
          Looks like you haven&apos;t added anything yet.
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

  const subtotal = totalPrice();
  const itemCount = totalItems();

  return (
    <div className="bg-warm-white">
      {/* Page header */}
      <div className="border-b border-light-beige px-5 py-10 sm:px-10 lg:px-16">
        <p className="text-[10px] tracking-[0.25em] text-burgundy">AYSEL</p>
        <h1 className="mt-2 font-display text-3xl text-soft-black sm:text-4xl">
          Shopping Bag
        </h1>
        <p className="mt-1 text-xs text-muted-grey">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

          {/* Item list */}
          <div className="min-w-0 flex-1">
            <ul className="divide-y divide-light-beige">
              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                const maxQty = product?.stockCount ?? 99;
                const atMax = item.quantity >= maxQty;
                const atMin = item.quantity <= 1;
                const isLocked = item.mergeLock === "pending";

                return (
                  <li
                    key={item.lineId}
                    className="flex gap-5 py-7 sm:gap-7"
                  >
                    {/* Image */}
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative h-32 w-24 shrink-0 overflow-hidden bg-light-beige sm:h-40 sm:w-28"
                      style={{ position: "relative" }}
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 96px, 112px"
                        className="object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.slug}`}
                            className="text-sm font-medium text-soft-black transition-colors hover:text-burgundy sm:text-base"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-[10px] tracking-widest text-muted-grey">
                              COLOUR: {item.color.toUpperCase()}
                            </p>
                            <p className="text-[10px] tracking-widest text-muted-grey">
                              SIZE: {item.size}
                            </p>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-grey">
                            {formatPrice(item.unitPrice)}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.lineId)}
                          disabled={isLocked}
                          aria-label={`Remove ${item.name} from bag`}
                          className="shrink-0 p-1 text-muted-grey transition-colors hover:text-soft-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Quantity + line total */}
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center border border-light-beige">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.lineId, item.quantity - 1)
                            }
                            disabled={atMin || isLocked}
                            aria-label="Decrease quantity"
                            className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-light-beige disabled:cursor-not-allowed disabled:text-light-beige"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-9 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.lineId, item.quantity + 1)
                            }
                            disabled={atMax || isLocked}
                            aria-label="Increase quantity"
                            className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-light-beige disabled:cursor-not-allowed disabled:text-light-beige"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {atMax && (
                          <p className="text-[10px] tracking-wider text-burgundy">
                            MAX STOCK REACHED
                          </p>
                        )}

                        <p className="ml-auto text-sm font-medium text-soft-black">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t border-light-beige pt-6">
              <Link
                href="/collections"
                className="text-[10px] tracking-widest text-muted-grey transition-colors hover:text-soft-black"
              >
                ← CONTINUE SHOPPING
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <aside className="w-full lg:w-80 xl:w-96">
            <div className="border border-light-beige p-6">
              <h2 className="font-display text-xl text-soft-black">
                Order Summary
              </h2>

              <dl className="mt-6 space-y-3 border-b border-light-beige pb-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-grey">
                    Subtotal ({itemCount}{" "}
                    {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd className="font-medium text-soft-black">
                    {formatPrice(subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-grey">Shipping</dt>
                  <dd className="text-muted-grey">Calculated at checkout</dd>
                </div>
              </dl>

              <div className="mt-5 flex justify-between text-sm font-medium">
                <span>Estimated Total</span>
                <span className="text-burgundy">{formatPrice(subtotal)}</span>
              </div>

              <p className="mt-2 text-[10px] text-muted-grey">
                Taxes and shipping calculated at checkout.
              </p>

              <Link
                href="/checkout"
                className="mt-6 flex h-[52px] w-full items-center justify-center gap-3 bg-burgundy text-[10px] tracking-[0.2em] text-warm-white transition-opacity hover:opacity-90"
              >
                PROCEED TO CHECKOUT <ArrowRight size={14} />
              </Link>

              <p className="mt-4 text-center text-[10px] text-muted-grey">
                Secure checkout · Free returns within 30 days
              </p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

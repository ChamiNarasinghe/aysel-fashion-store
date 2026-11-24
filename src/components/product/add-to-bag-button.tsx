"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { Product, ProductColor } from "@/data/products";

type Props = {
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
  onSizeError: () => void;
};

export default function AddToBagButton({
  product,
  selectedSize,
  selectedColor,
  quantity,
  onSizeError,
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.availability === "out-of-stock";

  function handleAdd() {
    if (!selectedSize) {
      onSizeError();
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      size: selectedSize,
      color: selectedColor.name,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className="flex h-[52px] w-full items-center justify-center gap-3 border border-light-beige bg-light-beige text-[10px] tracking-[0.2em] text-muted-grey cursor-not-allowed"
      >
        OUT OF STOCK
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`flex h-[52px] w-full items-center justify-center gap-3 text-[10px] tracking-[0.2em] transition-all duration-300 ${
        added
          ? "bg-soft-black text-warm-white"
          : "bg-burgundy text-warm-white hover:bg-soft-black"
      }`}
    >
      {added ? (
        <>
          <Check size={15} />
          ADDED TO BAG
        </>
      ) : (
        <>
          <ShoppingBag size={15} />
          ADD TO BAG
        </>
      )}
    </button>
  );
}

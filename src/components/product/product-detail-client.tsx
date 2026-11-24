"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import type { Product, ProductColor } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import ProductGallery from "@/components/product/product-gallery";
import ColorSelector from "@/components/product/color-selector";
import SizeSelector from "@/components/product/size-selector";
import QuantitySelector from "@/components/product/quantity-selector";
import AddToBagButton from "@/components/product/add-to-bag-button";
import ProductAccordion from "@/components/product/product-accordion";
import SizeGuideModal from "@/components/product/size-guide-modal";

type Props = {
  product: Product;
};

export default function ProductDetailClient({ product }: Props) {
  const allImages = [product.image, ...(product.additionalImages ?? [])];

  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { toggle, has } = useWishlistStore();

  useEffect(() => {
    useWishlistStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
    setMounted(true);
  }, []);

  const wishlisted = mounted && has(product.id);

  // When colour has an associated image, promote it to the front of the gallery
  const galleryImages = selectedColor.image
    ? [selectedColor.image, ...allImages.filter((img) => img !== selectedColor.image)]
    : allImages;

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    setSizeError(false);
  }

  // Availability display — using brand-safe colours only
  const availabilityConfig = {
    "in-stock":     { label: "In Stock",              className: "text-[#2D6A4F]" },
    "low-stock":    { label: "Low Stock — Order Soon", className: "text-[#B45309]" },
    "out-of-stock": { label: "Out of Stock",           className: "text-burgundy"  },
  }[product.availability];

  const accordionItems = [
    {
      title: "PRODUCT DESCRIPTION",
      content: <p>{product.description}</p>,
    },
    {
      title: "FABRIC & MATERIALS",
      content: <p>{product.details.fabric}</p>,
    },
    {
      title: "SIZE & FIT",
      content: <p>{product.details.fit}</p>,
    },
    {
      title: "CARE INSTRUCTIONS",
      content: (
        <ul className="flex flex-col gap-1">
          {product.details.care.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted-grey" />
              {line}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "SHIPPING & RETURNS",
      content: (
        <div className="flex flex-col gap-3">
          <p>{product.details.shipping}</p>
          <p>{product.details.returns}</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* ── Left: Gallery — sticky on desktop ── */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <ProductGallery images={galleryImages} productName={product.name} />
        </div>

        {/* ── Right: Product Info ── */}
        <div className="px-6 py-10 sm:px-10 lg:px-12 lg:py-12 xl:px-16 xl:py-16">
          <div className="mx-auto max-w-lg">

            {/* Badges row */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {product.isNew && (
                <span className="bg-burgundy px-3 py-1 text-[9px] tracking-widest text-warm-white">
                  NEW ARRIVAL
                </span>
              )}
              <span className={`text-[10px] tracking-widest ${availabilityConfig.className}`}>
                {availabilityConfig.label}
              </span>
            </div>

            {/* Category line */}
            <p className="text-[9px] tracking-[0.2em] text-muted-grey">
              {product.gender.toUpperCase()} · {product.category.toUpperCase()}
            </p>

            {/* Product name */}
            <h1 className="mt-3 font-display text-3xl leading-tight text-soft-black sm:text-4xl">
              {product.name}
            </h1>

            {/* Price */}
            <p className="mt-4 font-display text-2xl text-burgundy">
              {formatPrice(product.price)}
            </p>

            {/* Divider */}
            <div className="my-7 border-t border-light-beige" />

            {/* Colour selector */}
            <div className="mb-7">
              <ColorSelector
                colors={product.colors}
                selected={selectedColor}
                onChange={(c) => setSelectedColor(c)}
              />
            </div>

            {/* Size selector */}
            <div className="mb-7">
              <SizeSelector
                sizes={product.sizes}
                selected={selectedSize}
                onChange={handleSizeChange}
                error={sizeError}
                onSizeGuide={() => setSizeGuideOpen(true)}
              />
            </div>

            {/* Quantity selector */}
            <div className="mb-7">
              <QuantitySelector
                value={quantity}
                max={product.stockCount}
                onChange={setQuantity}
              />
            </div>

            {/* Add to Bag + Wishlist */}
            <div className="flex gap-3">
              <div className="flex-1">
                <AddToBagButton
                  product={product}
                  selectedSize={selectedSize}
                  selectedColor={selectedColor}
                  quantity={quantity}
                  onSizeError={() => setSizeError(true)}
                />
              </div>

              <button
                type="button"
                onClick={() => toggle(product.id)}
                aria-label={
                  wishlisted
                    ? `Remove ${product.name} from wishlist`
                    : `Add ${product.name} to wishlist`
                }
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center border border-light-beige transition-colors hover:border-burgundy hover:text-burgundy"
              >
                <Heart
                  size={20}
                  strokeWidth={1.5}
                  className={wishlisted ? "fill-burgundy text-burgundy" : ""}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-light-beige" />

            {/* Accordion */}
            <ProductAccordion items={accordionItems} />

          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <SizeGuideModal
          gender={product.gender}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}
    </>
  );
}

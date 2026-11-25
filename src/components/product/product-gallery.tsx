"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  productName: string;
};

export default function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const showThumbs = images.length > 1;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">

      {/* Thumbnails — left column on desktop, horizontal strip on mobile */}
      {showThumbs && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0" style={{ maxHeight: "calc(100vh - 120px)" }}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-light-beige transition-all duration-150 lg:w-[72px] ${
                activeIndex === i
                  ? "ring-2 ring-soft-black ring-offset-2 opacity-100"
                  : "opacity-55 hover:opacity-80 ring-1 ring-transparent"
              }`}
              style={{ position: "relative" }}
            >
              <Image
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className={`order-1 relative overflow-hidden bg-light-beige lg:order-2 lg:flex-1 ${showThumbs ? "aspect-[3/4]" : "aspect-[3/4]"}`} style={{ position: "relative" }}>
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${productName} — view ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover transition-opacity duration-300"
        />
      </div>

    </div>
  );
}

"use client";

import type { ProductSize } from "@/data/products";

type Props = {
  sizes: ProductSize[];
  selected: string;
  onChange: (size: string) => void;
  error?: boolean;
  onSizeGuide: () => void;
};

export default function SizeSelector({ sizes, selected, onChange, error, onSizeGuide }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-[10px] tracking-[0.15em] ${error ? "text-burgundy" : "text-muted-grey"}`}>
          {error ? "PLEASE SELECT A SIZE" : "SELECT SIZE"}
        </p>
        <button
          type="button"
          onClick={onSizeGuide}
          className="text-[10px] tracking-widest text-muted-grey underline underline-offset-2 hover:text-soft-black transition-colors"
        >
          SIZE GUIDE
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map(({ label, available }) => (
          <button
            key={label}
            type="button"
            disabled={!available}
            onClick={() => available && onChange(label)}
            aria-label={available ? `Select size ${label}` : `Size ${label} unavailable`}
            aria-pressed={available && selected === label}
            className={`h-11 min-w-[44px] px-3 text-[10px] tracking-[0.1em] transition-colors ${
              !available
                ? "cursor-not-allowed border border-light-beige text-muted-grey/40 line-through"
                : selected === label
                ? "border border-soft-black bg-soft-black text-warm-white"
                : error
                ? "border border-burgundy/50 text-soft-black hover:border-soft-black"
                : "border border-light-beige text-soft-black hover:border-soft-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

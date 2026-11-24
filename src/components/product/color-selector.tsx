"use client";

import type { ProductColor } from "@/data/products";

type Props = {
  colors: ProductColor[];
  selected: ProductColor;
  onChange: (color: ProductColor) => void;
};

// Colours that are too close to the warm-white background need a visible border
function isLightSwatch(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // Perceived luminance — flag anything above 220/255
  return (r * 0.299 + g * 0.587 + b * 0.114) > 220;
}

export default function ColorSelector({ colors, selected, onChange }: Props) {
  return (
    <div>
      <p className="mb-3 text-[10px] tracking-[0.15em] text-muted-grey">
        COLOUR —{" "}
        <span className="text-soft-black">{selected.name.toUpperCase()}</span>
      </p>

      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selected.name === color.name;
          const needsBorder = isLightSwatch(color.hex);

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onChange(color)}
              aria-label={`Select colour ${color.name}`}
              aria-pressed={isSelected}
              title={color.name}
              className={`h-8 w-8 rounded-full transition-all duration-150 ${
                isSelected
                  ? "ring-2 ring-soft-black ring-offset-2"
                  : needsBorder
                  ? "ring-1 ring-light-beige hover:ring-muted-grey"
                  : "ring-1 ring-transparent hover:ring-muted-grey/60"
              }`}
              style={{
                backgroundColor: color.hex,
                // Always show a subtle inset border on very light swatches
                boxShadow: needsBorder && !isSelected
                  ? "inset 0 0 0 1px #C8B89A"
                  : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

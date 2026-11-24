"use client";

type Props = {
  value: number;
  max: number;
  onChange: (value: number) => void;
};

export default function QuantitySelector({ value, max, onChange }: Props) {
  return (
    <div>
      <p className="mb-3 text-[10px] tracking-[0.15em] text-muted-grey">QUANTITY</p>

      <div className="inline-flex items-center border border-light-beige">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label="Decrease quantity"
          className="flex h-11 w-11 items-center justify-center text-lg text-soft-black transition-colors hover:bg-light-beige disabled:cursor-not-allowed disabled:text-light-beige"
        >
          −
        </button>

        <span
          aria-live="polite"
          aria-label={`Quantity: ${value}`}
          className="flex h-11 w-12 items-center justify-center text-sm text-soft-black"
        >
          {value}
        </span>

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Increase quantity"
          className="flex h-11 w-11 items-center justify-center text-lg text-soft-black transition-colors hover:bg-light-beige disabled:cursor-not-allowed disabled:text-light-beige"
        >
          +
        </button>
      </div>

      {max <= 5 && max > 0 && (
        <p className="mt-2 text-[10px] tracking-widest text-burgundy">
          ONLY {max} LEFT IN STOCK
        </p>
      )}
    </div>
  );
}

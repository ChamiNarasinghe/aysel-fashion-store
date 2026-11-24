"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  gender: "women" | "men" | "unisex";
  onClose: () => void;
};

const womenRows = [
  { size: "XS", uk: "6",  eu: "34", bust: "80–83", waist: "60–63", hips: "86–89" },
  { size: "S",  uk: "8",  eu: "36", bust: "84–87", waist: "64–67", hips: "90–93" },
  { size: "M",  uk: "10", eu: "38", bust: "88–91", waist: "68–71", hips: "94–97" },
  { size: "L",  uk: "12", eu: "40", bust: "92–95", waist: "72–75", hips: "98–101" },
  { size: "XL", uk: "14", eu: "42", bust: "96–99", waist: "76–79", hips: "102–105" },
  { size: "XXL",uk: "16", eu: "44", bust: "100–103", waist: "80–83", hips: "106–109" },
];

const menRows = [
  { size: "XS", uk: "34", eu: "44", chest: "84–87", waist: "70–73", hips: "86–89" },
  { size: "S",  uk: "36", eu: "46", chest: "88–91", waist: "74–77", hips: "90–93" },
  { size: "M",  uk: "38", eu: "48", chest: "92–95", waist: "78–81", hips: "94–97" },
  { size: "L",  uk: "40", eu: "50", chest: "96–99", waist: "82–85", hips: "98–101" },
  { size: "XL", uk: "42", eu: "52", chest: "100–103", waist: "86–89", hips: "102–105" },
  { size: "XXL",uk: "44", eu: "54", chest: "104–107", waist: "90–93", hips: "106–109" },
];

export default function SizeGuideModal({ gender, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on open
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isWomen = gender !== "men";
  const rows = isWomen ? womenRows : menRows;
  const thirdCol = isWomen ? "Bust (cm)" : "Chest (cm)";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-soft-black/40" aria-hidden="true" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-warm-white sm:mx-4 sm:rounded-none">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-beige px-6 py-5">
          <div>
            <p className="text-[9px] tracking-[0.25em] text-burgundy">AYSEL</p>
            <h2
              id="size-guide-title"
              className="mt-1 font-display text-xl text-soft-black"
            >
              Size Guide
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="flex h-9 w-9 items-center justify-center text-muted-grey transition-colors hover:text-soft-black"
          >
            <X size={18} />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="border-b border-light-beige bg-[#F3EFE6] px-6 py-3">
          <p className="text-[10px] leading-5 text-muted-grey">
            Measurements below are illustrative and intended as a general guide only.
            For the best fit, we recommend measuring yourself and comparing to the product&apos;s
            specific fit notes.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-6 py-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-light-beige">
                {["Size", "UK", "EU", thirdCol, "Waist (cm)", "Hips (cm)"].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-4 text-[9px] font-semibold tracking-[0.18em] text-muted-grey last:pr-0"
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.size}
                  className={`border-b border-light-beige/60 ${i % 2 === 0 ? "" : "bg-[#F9F6EF]"}`}
                >
                  <td className="py-3 pr-4 text-[11px] font-semibold tracking-widest text-soft-black">
                    {row.size}
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-muted-grey">{row.uk}</td>
                  <td className="py-3 pr-4 text-[11px] text-muted-grey">{row.eu}</td>
                  <td className="py-3 pr-4 text-[11px] text-muted-grey">
                    {"bust" in row ? row.bust : row.chest}
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-muted-grey">{row.waist}</td>
                  <td className="py-3 text-[11px] text-muted-grey">{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to measure */}
        <div className="border-t border-light-beige px-6 pb-8 pt-5">
          <p className="mb-4 text-[9px] font-semibold tracking-[0.18em] text-muted-grey">
            HOW TO MEASURE
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: isWomen ? "Bust" : "Chest",
                desc: "Measure around the fullest part of your chest, keeping the tape parallel to the floor.",
              },
              {
                label: "Waist",
                desc: "Measure around your natural waistline, the narrowest part of your torso.",
              },
              {
                label: "Hips",
                desc: "Measure around the fullest part of your hips, approximately 20 cm below your waist.",
              },
            ].map(({ label, desc }) => (
              <div key={label}>
                <p className="mb-1 text-[10px] font-medium tracking-widest text-soft-black">
                  {label.toUpperCase()}
                </p>
                <p className="text-[10px] leading-5 text-muted-grey">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

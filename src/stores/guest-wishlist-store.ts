"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GuestWishlistItem, MergeLock } from "@/lib/shopping/types";
import { safeStorage } from "@/lib/storage/safe-storage";

// ── Helpers ───────────────────────────────────────────────────────────────────

function newLineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Store type ────────────────────────────────────────────────────────────────

type GuestWishlistStore = {
  items: GuestWishlistItem[];
  toggle: (productId: number) => void;
  has: (productId: number) => boolean;
  clearItems: () => void;
  applyMergeLocks: (lineIds: string[]) => void;
  releaseMergeLocks: (lineIds: string[]) => void;
  removeByLineIds: (lineIds: string[]) => void;
  restoreSnapshotItems: (items: GuestWishlistItem[]) => void;
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGuestWishlistStore = create<GuestWishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (productId) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          if (existing) {
            // Locked items cannot be removed
            if (existing.mergeLock === "pending") return state;
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: [
              ...state.items,
              { lineId: newLineId(), productId, mergeLock: "none" as MergeLock },
            ],
          };
        });
      },

      has: (productId) => get().items.some((i) => i.productId === productId),

      clearItems: () => set({ items: [] }),

      applyMergeLocks: (lineIds) => {
        set((state) => ({
          items: state.items.map((i) =>
            lineIds.includes(i.lineId)
              ? { ...i, mergeLock: "pending" as MergeLock }
              : i
          ),
        }));
      },

      releaseMergeLocks: (lineIds) => {
        set((state) => ({
          items: state.items.map((i) =>
            lineIds.includes(i.lineId)
              ? { ...i, mergeLock: "none" as MergeLock }
              : i
          ),
        }));
      },

      removeByLineIds: (lineIds) => {
        set((state) => ({
          items: state.items.filter((i) => !lineIds.includes(i.lineId)),
        }));
      },

      restoreSnapshotItems: (items) => {
        set({ items });
      },
    }),
    {
      name: "aysel-guest-wishlist",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
    }
  )
);

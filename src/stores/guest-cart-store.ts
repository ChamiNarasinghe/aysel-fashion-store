"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GuestCartItem, MergeLock } from "@/lib/shopping/types";
import { safeStorage } from "@/lib/storage/safe-storage";

// ── Helpers ───────────────────────────────────────────────────────────────────

function newLineId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sameVariant(a: GuestCartItem, productId: number, size: string, color: string): boolean {
  return a.productId === productId && a.size === size && a.color === color;
}

function isLocked(item: GuestCartItem): boolean {
  return item.mergeLock === "pending";
}

function isValidQuantity(q: number): boolean {
  return Number.isInteger(q) && q >= 1;
}

// ── New item input type (no lineId/lineVersion/mergeLock — generated here) ────

export type GuestCartInput = Omit<GuestCartItem, "lineId" | "lineVersion" | "mergeLock">;

// ── Store type ────────────────────────────────────────────────────────────────

type GuestCartStore = {
  items: GuestCartItem[];
  addItem: (input: GuestCartInput) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  applyMergeLocks: (lineIds: string[]) => void;
  releaseMergeLocks: (lineIds: string[]) => void;
  removeByLineIds: (lineIds: string[]) => void;
  restoreSnapshotItems: (items: GuestCartItem[]) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGuestCartStore = create<GuestCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        if (!isValidQuantity(input.quantity)) return;
        if (!input.productId || !input.size || !input.color) return;

        set((state) => {
          const idx = state.items.findIndex((i) =>
            sameVariant(i, input.productId, input.size, input.color)
          );

          if (idx !== -1) {
            const existing = state.items[idx];
            // Locked lines cannot be incremented
            if (isLocked(existing)) return state;
            const updated = [...state.items];
            updated[idx] = {
              ...existing,
              quantity: existing.quantity + input.quantity,
              lineVersion: existing.lineVersion + 1,
            };
            return { items: updated };
          }

          const newItem: GuestCartItem = {
            ...input,
            lineId: newLineId(),
            lineVersion: 1,
            mergeLock: "none",
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.lineId === lineId && !isLocked(i))
          ),
        }));
      },

      updateQuantity: (lineId, quantity) => {
        if (!isValidQuantity(quantity)) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.lineId === lineId && !isLocked(i) ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

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

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    {
      name: "aysel-guest-cart",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
    }
  )
);

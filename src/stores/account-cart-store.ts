"use client";

import { create } from "zustand";
import type { AccountCartItem } from "@/lib/shopping/types";

// ── Store type ────────────────────────────────────────────────────────────────

type AccountCartStore = {
  ownerId: string | null;
  items: AccountCartItem[];
  loading: boolean;
  error: string | null;
  setOwner: (userId: string) => void;
  setItems: (userId: string, items: AccountCartItem[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearForUser: (userId: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

// ── Store ─────────────────────────────────────────────────────────────────────
// No persist middleware — account data must never be written to guest storage keys.

export const useAccountCartStore = create<AccountCartStore>()((set, get) => ({
  ownerId: null,
  items: [],
  loading: false,
  error: null,

  setOwner: (userId) => {
    // If switching users, clear previous state first
    if (get().ownerId !== null && get().ownerId !== userId) {
      set({ ownerId: userId, items: [], error: null });
    } else {
      set({ ownerId: userId });
    }
  },

  setItems: (userId, items) => {
    // Only accept data for the current owner
    if (get().ownerId !== userId) return;
    set({ items });
  },

  updateQuantity: (id, quantity) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  clearForUser: (userId) => {
    if (get().ownerId === userId) {
      set({ items: [], error: null });
    }
  },

  clearAll: () => set({ ownerId: null, items: [], loading: false, error: null }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));

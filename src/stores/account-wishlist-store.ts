"use client";

import { create } from "zustand";
import type { AccountWishlistItem } from "@/lib/shopping/types";

// ── Store type ────────────────────────────────────────────────────────────────

type AccountWishlistStore = {
  ownerId: string | null;
  items: AccountWishlistItem[];
  loading: boolean;
  error: string | null;
  setOwner: (userId: string) => void;
  setItems: (userId: string, items: AccountWishlistItem[]) => void;
  removeItem: (id: string) => void;
  clearForUser: (userId: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

// ── Store ─────────────────────────────────────────────────────────────────────
// No persist middleware — account data must never be written to guest storage keys.

export const useAccountWishlistStore = create<AccountWishlistStore>()((set, get) => ({
  ownerId: null,
  items: [],
  loading: false,
  error: null,

  setOwner: (userId) => {
    if (get().ownerId !== null && get().ownerId !== userId) {
      set({ ownerId: userId, items: [], error: null });
    } else {
      set({ ownerId: userId });
    }
  },

  setItems: (userId, items) => {
    if (get().ownerId !== userId) return;
    set({ items });
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

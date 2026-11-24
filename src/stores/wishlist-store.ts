"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistStore = {
  ids: number[];
  toggle: (id: number) => void;
  has: (id: number) => boolean;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (id) => {
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((i) => i !== id)
            : [...state.ids, id],
        }));
      },

      has: (id) => get().ids.includes(id),
    }),
    {
      name: "aysel-wishlist",
      skipHydration: true,
    }
  )
);

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./product-data";

interface RecentlyViewedState {
  items: { product: Product; viewedAt: number }[];
  addProduct: (product: Product) => void;
  getRecent: (limit?: number) => { product: Product; viewedAt: number }[];
}

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      addProduct: (product) => {
        set((state) => {
          const filtered = state.items.filter((i) => i.product.id !== product.id);
          return {
            items: [{ product, viewedAt: Date.now() }, ...filtered].slice(0, 20),
          };
        });
      },

      getRecent: (limit = 8) => {
        return get().items.slice(0, limit);
      },
    }),
    { name: "modit-recently-viewed" }
  )
);

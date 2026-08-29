"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./product-data";

interface ComparisonState {
  items: Product[];
  maxItems: number;

  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  canAdd: () => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,

      addToCompare: (product) => {
        let added = false;
        set((state) => {
          if (state.items.length >= state.maxItems) return state;
          if (state.items.some((i) => i.id === product.id)) return state;
          added = true;
          return { items: [...state.items, product] };
        });
        return added;
      },

      removeFromCompare: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },

      clearCompare: () => set({ items: [] }),

      isInCompare: (productId) => get().items.some((i) => i.id === productId),

      canAdd: () => get().items.length < get().maxItems,
    }),
    {
      name: "modit-comparison",
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

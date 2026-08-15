"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./product-data";

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  removeWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (product) => {
        set((state) => {
          const exists = state.items.some((i) => i.id === product.id);
          if (exists) {
            return { items: state.items.filter((i) => i.id !== product.id) };
          }
          return { items: [...state.items, product] };
        });
      },

      isWishlisted: (productId) => {
        return get().items.some((i) => i.id === productId);
      },

      removeWishlist: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "modit-wishlist",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

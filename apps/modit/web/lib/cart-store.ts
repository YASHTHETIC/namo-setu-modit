"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./product-data";

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

export interface SavedItem {
  product: Product;
  savedAt: number;
}

interface CartState {
  items: CartItem[];
  savedItems: SavedItem[];
  pincode: string;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;

  setPincode: (pincode: string) => void;

  getCartTotal: () => number;
  getCartMRP: () => number;
  getCartDiscount: () => number;
  getCartGST: () => number;
  getCartCount: () => number;
  getCartShipping: () => number;
  getCartGrandTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedItems: [],
      pincode: "110001",

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stockLevel) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { product, quantity, addedAt: Date.now() }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.product.id !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.product.id === productId
                ? { ...i, quantity: Math.min(quantity, i.product.stockLevel) }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      saveForLater: (productId) => {
        set((state) => {
          const item = state.items.find((i) => i.product.id === productId);
          if (!item) return state;
          return {
            items: state.items.filter((i) => i.product.id !== productId),
            savedItems: [
              ...state.savedItems.filter((s) => s.product.id !== productId),
              { product: item.product, savedAt: Date.now() },
            ],
          };
        });
      },

      moveToCart: (productId) => {
        set((state) => {
          const saved = state.savedItems.find((s) => s.product.id === productId);
          if (!saved) return state;
          const existing = state.items.find((i) => i.product.id === productId);
          if (existing) {
            return {
              savedItems: state.savedItems.filter((s) => s.product.id !== productId),
            };
          }
          return {
            savedItems: state.savedItems.filter((s) => s.product.id !== productId),
            items: [...state.items, { product: saved.product, quantity: 1, addedAt: Date.now() }],
          };
        });
      },

      removeSaved: (productId) => {
        set((state) => ({
          savedItems: state.savedItems.filter((s) => s.product.id !== productId),
        }));
      },

      setPincode: (pincode) => set({ pincode }),

      getCartTotal: () => {
        return get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
      },

      getCartMRP: () => {
        return get().items.reduce((sum, i) => sum + i.product.mrp * i.quantity, 0);
      },

      getCartDiscount: () => {
        return get().getCartMRP() - get().getCartTotal();
      },

      getCartGST: () => {
        return get().items.reduce(
          (sum, i) => sum + i.product.price * i.quantity * (i.product.gstRate / 100),
          0
        );
      },

      getCartCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getCartShipping: () => {
        const total = get().getCartTotal();
        if (total >= 5000) return 0;
        return 250;
      },

      getCartGrandTotal: () => {
        const state = get();
        return state.getCartTotal() + state.getCartGST() + state.getCartShipping();
      },
    }),
    {
      name: "modit-cart",
      partialize: (state) => ({
        items: state.items,
        savedItems: state.savedItems,
        pincode: state.pincode,
      }),
    }
  )
);

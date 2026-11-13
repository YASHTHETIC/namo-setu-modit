"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./product-data";
import { resolveProduct } from "./pricing";

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
  variantId?: string;
  shade?: string;
  unitPrice?: number;
}

/** Live unit price: admin overrides + active sale always win over the add-time snapshot. */
export function getLiveUnitPrice(item: CartItem): number {
  const resolved = resolveProduct(item.product);
  if (item.variantId) {
    const variant = resolved.variants?.find((v) => v.id === item.variantId);
    if (variant) return variant.price;
  }
  return resolved.price;
}

export function getBulkUnitPrice(item: CartItem): number {
  const resolved = resolveProduct(item.product);
  const unitPrice = getLiveUnitPrice(item);
  const bulk = item.variantId
    ? resolved.variants?.find((v) => v.id === item.variantId)?.bulkPrice ?? resolved.bulkPrice
    : resolved.bulkPrice;
  const bulkMin = item.variantId
    ? resolved.variants?.find((v) => v.id === item.variantId)?.bulkMinQty ?? resolved.bulkMinQty
    : resolved.bulkMinQty;
  if (bulk != null && bulkMin != null && item.quantity >= bulkMin) {
    return bulk;
  }
  return unitPrice;
}

export function isBulkApplied(item: CartItem): boolean {
  const effective = getBulkUnitPrice(item);
  const unitPrice = getLiveUnitPrice(item);
  return effective < unitPrice;
}

export function bulkSavingsForItem(item: CartItem): number {
  const unitPrice = getLiveUnitPrice(item);
  const effective = getBulkUnitPrice(item);
  return (unitPrice - effective) * item.quantity;
}

export interface SavedItem {
  product: Product;
  savedAt: number;
  variantId?: string;
  shade?: string;
  unitPrice?: number;
}

interface CartState {
  items: CartItem[];
  savedItems: SavedItem[];
  pincode: string;

  addItem: (product: Product, quantity?: number, variantId?: string, shade?: string) => void;
  removeItem: (productId: string, variantId?: string, shade?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string, shade?: string) => void;
  stepDown: (productId: string, variantId?: string, shade?: string) => void;
  clearCart: () => void;

  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;

  setPincode: (pincode: string) => void;

  getCartTotal: () => number;
  getCartMRP: () => number;
  getCartDiscount: () => number;
  getBulkSavings: () => number;
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

      addItem: (product, quantity = 1, variantId, shade) => {
        set((state) => {
          const variant = variantId ? product.variants?.find((v) => v.id === variantId) : null;
          const unitPrice = variant?.price ?? product.price;
          // Merge identity must survive the TWO product sources that can feed
          // the cart (static catalog slugs vs backend UUIDs share a SKU but
          // differ in id). SKU is the stable key; id is the fallback for
          // sources without one.
          const keyOf = (p: { sku?: string; id: string }) => p.sku || p.id;
          const key = `${keyOf(product)}:${variantId || "default"}:${shade || "default"}`;
          const sameLine = (i: { product: { sku?: string; id: string }; variantId?: string; shade?: string }) =>
            `${keyOf(i.product)}:${i.variantId || "default"}:${i.shade || "default"}` === key;
          const existing = state.items.find(sameLine);
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i)
                  ? { ...i, quantity: Math.min(i.quantity + quantity, variant?.stockLevel ?? product.stockLevel), unitPrice, shade: shade || i.shade }
                  : i
              ),
            };
          }
          // If adding with a shade, upgrade any existing unshaded line for this product/variant
          if (shade) {
            const unshadedIndex = state.items.findIndex(
              (i) => keyOf(i.product) === keyOf(product) && (i.variantId || "default") === (variantId || "default") && !i.shade
            );
            if (unshadedIndex !== -1) {
              return {
                items: state.items.map((i, idx) =>
                  idx === unshadedIndex
                    ? { ...i, shade, unitPrice, quantity: Math.max(i.quantity, quantity) }
                    : i
                ),
              };
            }
          }
          return {
            items: [...state.items, { product, quantity, addedAt: Date.now(), variantId, shade, unitPrice }],
          };
        });
      },

      removeItem: (productId, variantId, shade) => {
        const matches = (i: { product: { sku?: string; id: string }; variantId?: string; shade?: string }) => {
          const idMatch = i.product.id === productId || i.product.sku === productId;
          if (!idMatch) return false;
          if (variantId !== undefined && (i.variantId || null) !== (variantId || null)) return false;
          if (shade !== undefined && (i.shade || null) !== (shade || null)) return false;
          return true;
        };
        set((state) => ({
          items: state.items.filter((i) => !matches(i)),
        }));
      },

      updateQuantity: (productId, quantity, variantId, shade) => {
        set((state) => {
          const matches = (i: { product: { sku?: string; id: string }; variantId?: string; shade?: string }) => {
            const idMatch = i.product.id === productId || i.product.sku === productId;
            if (!idMatch) return false;
            if (variantId !== undefined && (i.variantId || null) !== (variantId || null)) return false;
            if (shade !== undefined && (i.shade || null) !== (shade || null)) return false;
            return true;
          };
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => !matches(i)),
            };
          }
          return {
            items: state.items.map((i) => {
              const match = matches(i);
              return match
                ? { ...i, quantity: Math.min(quantity, i.variantId ? (i.product.variants?.find((v) => v.id === i.variantId)?.stockLevel ?? i.product.stockLevel) : i.product.stockLevel) }
                : i;
            }),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      stepDown: (productId, variantId, shade) => {
        set((state) => {
          const idx = state.items.findIndex(
            (i) =>
              (i.product.id === productId || i.product.sku === productId) &&
              (variantId !== undefined ? (i.variantId ?? null) === (variantId ?? null) : true) &&
              (shade !== undefined ? (i.shade ?? null) === (shade ?? null) : true)
          );
          if (idx < 0) return state;
          const line = state.items[idx];
          if (line.quantity <= 1) {
            return { items: state.items.filter((_, j) => j !== idx) };
          }
          const items = [...state.items];
          items[idx] = { ...line, quantity: line.quantity - 1 };
          return { items };
        });
      },

      saveForLater: (productId) => {
        set((state) => {
          const item = state.items.find((i) => i.product.id === productId || i.product.sku === productId);
          if (!item) return state;
          return {
            items: state.items.filter((i) => !(i.product.id === productId || i.product.sku === productId)),
            savedItems: [
              ...state.savedItems.filter((s) => !(s.product.id === productId || s.product.sku === productId)),
              { product: item.product, savedAt: Date.now(), variantId: item.variantId, shade: item.shade, unitPrice: item.unitPrice },
            ],
          };
        });
      },

      moveToCart: (productId) => {
        set((state) => {
          const saved = state.savedItems.find((s) => s.product.id === productId || s.product.sku === productId);
          if (!saved) return state;
          const existing = state.items.find((i) => i.product.id === productId || i.product.sku === productId);
          if (existing) {
            return {
              savedItems: state.savedItems.filter((s) => !(s.product.id === productId || s.product.sku === productId)),
            };
          }
          return {
            savedItems: state.savedItems.filter((s) => !(s.product.id === productId || s.product.sku === productId)),
            items: [...state.items, { product: saved.product, quantity: 1, addedAt: Date.now(), variantId: saved.variantId, shade: saved.shade, unitPrice: saved.unitPrice }],
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
        return get().items.reduce((sum, i) => sum + getBulkUnitPrice(i) * i.quantity, 0);
      },

      getCartMRP: () => {
        return get().items.reduce((sum, i) => {
          const resolved = resolveProduct(i.product);
          const variant = i.variantId ? resolved.variants?.find((v) => v.id === i.variantId) : null;
          return sum + (variant?.mrp ?? resolved.mrp) * i.quantity;
        }, 0);
      },

      getCartDiscount: () => {
        return get().getCartMRP() - get().getCartTotal();
      },

      getBulkSavings: () => {
        return get().items.reduce((sum, i) => sum + bulkSavingsForItem(i), 0);
      },

      getCartGST: () => {
        return get().items.reduce(
          (sum, i) => sum + getBulkUnitPrice(i) * i.quantity * (resolveProduct(i.product).gstRate / 100),
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

"use client";

import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/product-data";

/**
 * Single add-to-cart entry point (one pattern for every card/button).
 * Adds directly to cart (guest-supported with cross-device sync on login).
 * Returns true when the item landed in the cart.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);

  return (product: Product, quantity = 1, variantId?: string, shade?: string) => {
    addItem(product, quantity, variantId, shade);
    return true;
  };
}

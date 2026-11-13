"use client";

import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/product-data";
import { isPaintProduct } from "@/lib/pricing";

/**
 * Single add-to-cart entry point (one pattern for every card/button).
 * Adds directly to cart (guest-supported with cross-device sync on login).
 * Returns true when the item landed in the cart, or false if option/shade selection is required.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);

  return (product: Product, quantity = 1, variantId?: string, shade?: string) => {
    // Paints and shade-bearing products MUST have a chosen colour shade before cart add
    const needsShade = (isPaintProduct(product) || Boolean(product.hasShades)) && !shade;
    if (needsShade) {
      return false;
    }
    addItem(product, quantity, variantId, shade);
    return true;
  };
}

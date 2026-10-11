"use client";

import { useCartStore } from "@/lib/cart-store";
import { useRequireLogin } from "@/lib/use-auth";
import type { Product } from "@/lib/product-data";

/**
 * Single add-to-cart entry point (one pattern for every card/button).
 * Login-gates exactly like the storefront always has, then adds.
 * Returns true when the item actually landed in the cart.
 */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const requireLogin = useRequireLogin();

  return (product: Product, quantity = 1, variantId?: string, shade?: string) => {
    if (!requireLogin()) return false;
    addItem(product, quantity, variantId, shade);
    return true;
  };
}

"use client";

import { useWishlistStore } from "@/lib/wishlist-store";
import type { Product } from "@/lib/product-data";

/**
 * Single wishlist-toggle entry point (one pattern for every card).
 * Returns the current state plus a toggle for the given product.
 */
export function useWishlistToggle(product: Product | null | undefined) {
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);

  const wishlisted = product ? isWishlisted(product.id) : false;
  const toggle = () => {
    if (product) toggleWishlist(product);
  };
  return { wishlisted, toggle };
}

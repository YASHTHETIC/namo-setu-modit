"use client";

import { useComparisonStore } from "@/lib/comparison-store";
import type { Product } from "@/lib/product-data";

/**
 * Single compare-toggle entry point (one pattern for every card).
 * Returns the current state plus a toggle for the given product.
 */
export function useCompareToggle(product: Product | null | undefined) {
  const addToCompare = useComparisonStore((s) => s.addToCompare);
  const removeFromCompare = useComparisonStore((s) => s.removeFromCompare);
  const isInCompare = useComparisonStore((s) => s.isInCompare);
  const canAdd = useComparisonStore((s) => s.canAdd);

  const comparing = product ? isInCompare(product.id) : false;
  const toggle = () => {
    if (!product) return;
    if (isInCompare(product.id)) removeFromCompare(product.id);
    else addToCompare(product);
  };
  return { comparing, canAdd: canAdd(), toggle };
}

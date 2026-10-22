"use client";

import type { Product } from "./product-data";
import { getProductById, COMMON_EMULSION_SHADES, isTintableEmulsion } from "./product-data";
import type { Sale } from "./admin-store";

export interface DisplayProduct extends Product {
  onSale: boolean;
  saleName: string | null;
  salePrice: number | null;
  hidden: boolean;
}

export function saleAppliesTo(sale: Sale, product: Product): boolean {
  if (sale.scope === "all") return true;
  if (sale.scope === "category") return sale.categorySlugs.includes(product.categorySlug);
  if (sale.scope === "products") return sale.productIds.includes(product.id);
  return false;
}

/**
 * Resolve display fields for a product. Prices come straight from the
 * product row (server list_price/mrp when served by the API) — no client
 * overrides and no sale math. Per launch decision, display = charged.
 */
export function resolveProduct(product: Product): DisplayProduct {
  const price = product.price;
  const mrp = product.mrp;

  // Every tintable emulsion carries the full shade card (like a dealer fan-deck),
  // so colour options appear on all emulsion paints, not just the few with
  // hand-entered shades.
  const needsShades =
    !product.hasShades && (!product.shades || product.shades.length === 0) && isTintableEmulsion(product);

  const discount =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : product.discount;

  return {
    ...product,
    price,
    mrp,
    discount,
    onSale: false,
    saleName: null,
    salePrice: null,
    hidden: false,
    hasShades: product.hasShades || needsShades,
    shades: needsShades ? COMMON_EMULSION_SHADES : product.shades,
  };
}

/** Resolve a list, dropping hidden products. */
export function useDisplayProducts(products: Product[]): DisplayProduct[] {
  return products
    .map((p) => resolveProduct(p))
    .filter((p) => !p.hidden);
}

/**
 * Current active sale — server-side sales engine is not launched yet, so
 * there is never a client-visible sale. Kept for the future integration point.
 */
export function useActiveSale(): Sale | null {
  return null;
}

export interface LiveSummary {
  price: number;
  mrp: number;
  discount: number;
  onSale: boolean;
  saleName: string | null;
  hidden: boolean;
}

/**
 * Live pricing for lightweight summary cards (home rails) that only carry
 * id + fallback price/mrp/discount. Falls back to the baked-in values when
 * the full product is unavailable.
 */
export function useLiveSummary(
  id: string,
  fallback: { price: number; mrp: number; discount: number }
): LiveSummary {
  const full = getProductById(id);
  if (!full) return { ...fallback, onSale: false, saleName: null, hidden: false };
  const r = resolveProduct(full);
  return {
    price: r.price,
    mrp: r.mrp,
    discount: r.discount,
    onSale: r.onSale,
    saleName: r.saleName,
    hidden: r.hidden,
  };
}

/** Non-reactive version for event handlers. */
export function getLiveSummary(
  id: string,
  fallback: { price: number; mrp: number; discount: number }
): LiveSummary {
  const full = getProductById(id);
  if (!full) return { ...fallback, onSale: false, saleName: null, hidden: false };
  const r = resolveProduct(full);
  return {
    price: r.price,
    mrp: r.mrp,
    discount: r.discount,
    onSale: r.onSale,
    saleName: r.saleName,
    hidden: r.hidden,
  };
}

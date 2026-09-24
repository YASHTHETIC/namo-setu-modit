"use client";

import type { Product } from "./product-data";
import { useAdminStore, getActiveSaleAt, type Sale } from "./admin-store";

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

/** Merge admin price/stock overrides + the currently active sale into a product. */
export function resolveProduct(product: Product, now: number = Date.now()): DisplayProduct {
  const { overrides, sales } = useAdminStore.getState();
  const ov = overrides[product.id];

  let price = ov?.price ?? product.price;
  const mrp = ov?.mrp ?? product.mrp;
  const bulkPrice = ov && "bulkPrice" in ov ? ov.bulkPrice ?? null : product.bulkPrice;
  const bulkMinQty = ov && "bulkMinQty" in ov ? ov.bulkMinQty ?? null : product.bulkMinQty;
  const stockLevel = ov?.stockLevel ?? product.stockLevel;
  const inStock = ov?.inStock ?? product.inStock;
  const hidden = ov?.hidden ?? false;

  let onSale = false;
  let saleName: string | null = null;
  let salePrice: number | null = null;

  const sale = getActiveSaleAt(sales, now);
  if (sale && saleAppliesTo(sale, product)) {
    const discounted =
      sale.type === "percent"
        ? Math.round(price * (1 - sale.value / 100))
        : Math.max(1, price - sale.value);
    if (discounted < price) {
      onSale = true;
      saleName = sale.name;
      salePrice = discounted;
      price = discounted;
    }
  }

  const discount =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : product.discount;

  return {
    ...product,
    price,
    mrp,
    discount,
    bulkPrice,
    bulkMinQty,
    stockLevel,
    inStock: hidden ? false : inStock,
    onSale,
    saleName,
    salePrice,
    hidden,
  };
}

export function isHidden(product: Product): boolean {
  return useAdminStore.getState().overrides[product.id]?.hidden === true;
}

/** Resolve a list, dropping hidden products. Reactive hook version for components. */
export function useDisplayProducts(products: Product[]): DisplayProduct[] {
  const overrides = useAdminStore((s) => s.overrides);
  const sales = useAdminStore((s) => s.sales);
  // subscribe so components re-render when admin changes anything
  void overrides;
  void sales;
  return products
    .map((p) => resolveProduct(p))
    .filter((p) => !p.hidden);
}

/** Current active sale (reactive). */
export function useActiveSale(): Sale | null {
  const sales = useAdminStore((s) => s.sales);
  return getActiveSaleAt(sales, Date.now());
}

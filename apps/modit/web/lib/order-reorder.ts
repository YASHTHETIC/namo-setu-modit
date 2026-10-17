import { getProductById, getProductBySku, type Product } from "./product-data.ts";

/**
 * One line of a past order, in either shape the app sees:
 * - static/demo list rows: { productId, quantity }
 * - server API rows (snake_case): { product_id, sku, quantity }
 */
export interface ReorderLine {
  productId?: string | null;
  product_id?: string | null;
  sku?: string | null;
  quantity?: number | null;
}

/**
 * Resolve an order line to a live catalog product.
 *
 * Server orders reference products by DB UUID (product_id), which never
 * matches the static catalog ids ("cement-acc" …) — but SKU is shared
 * across static rows, live API rows and the server catalog, so it is the
 * only reliable join key. Returns undefined when the product is gone;
 * callers must skip the line and never invent a placeholder (a placeholder
 * would fail server checkout with an unknown SKU).
 */
export function resolveReorderProduct(line: ReorderLine): Product | undefined {
  const id = line.productId ?? line.product_id ?? undefined;
  const byId = id ? getProductById(id) : undefined;
  if (byId) return byId;
  return getProductBySku(line.sku ?? "");
}

/** Normalize a line quantity to a positive integer (defaults to 1). */
export function reorderQuantity(line: ReorderLine): number {
  const q = Number(line.quantity ?? 1);
  return Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
}

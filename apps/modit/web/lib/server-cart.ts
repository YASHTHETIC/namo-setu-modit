"use client";

import { getModitApi } from "@/lib/modit-api";
import { getAccessToken } from "@/lib/auth";
import { fetchProductById } from "@/lib/hybrid-api";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/product-data";

/**
 * Server cart sync (Blinkit-style cross-device cart).
 *
 * - Guests: localStorage cart only (works offline, unchanged behavior).
 * - Logged in: local stays the UI truth; every change is mirrored to the
 *   server (debounced, best-effort — offline keeps working).
 * - Login: local rows merge up, then missing server rows union in by SKU.
 *   Local rows are never deleted by sync (no wipe risk).
 */

const skuToId = new Map<string, string>();

function loggedIn(): boolean {
  try {
    return Boolean(getAccessToken());
  } catch {
    return false;
  }
}

async function resolveProductId(sku: string): Promise<string | null> {
  if (!sku) return null;
  const hit = skuToId.get(sku);
  if (hit) return hit;
  try {
    const res = await getModitApi().listProducts({ search: sku });
    const match = (res.items ?? []).find((p: any) => p.sku === sku);
    if (match) {
      skuToId.set(sku, match.id);
      return match.id;
    }
  } catch {
    /* offline — keep local */
  }
  return null;
}

function lineKey(sku: string, variantId?: string | null): string {
  return `${sku}::${variantId ?? ""}`;
}

/** Push current local lines up (merge semantics server-side). */
export async function pushLocalCartToServer(): Promise<void> {
  if (!loggedIn()) return;
  const items = useCartStore.getState().items;
  const resolved: Array<{ product_id: string; variant_key: string; shade: string | null; quantity: number }> = [];
  for (const it of items) {
    const pid = await resolveProductId(it.product.sku);
    if (!pid) continue;
    resolved.push({
      product_id: pid,
      variant_key: it.variantId ?? "",
      shade: it.shade ?? null,
      quantity: it.quantity,
    });
  }
  try {
    await getModitApi().mergeServerCart(resolved);
  } catch {
    /* offline — local stays truth */
  }
}

let resyncTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced full resync (clear + merge) after local edits. */
export function queueServerResync(): void {
  if (!loggedIn()) return;
  if (resyncTimer) clearTimeout(resyncTimer);
  resyncTimer = setTimeout(() => {
    resyncTimer = null;
    void (async () => {
      if (!loggedIn()) return;
      try {
        await getModitApi().clearServerCart();
      } catch {
        return; // offline — local stays truth
      }
      await pushLocalCartToServer();
    })();
  }, 900);
}

/** Union missing server rows into the local cart (by SKU + variant). */
export async function pullServerCartIntoStore(): Promise<void> {
  if (!loggedIn()) return;
  let rows;
  try {
    rows = await getModitApi().listCartItems();
  } catch {
    return;
  }
  if (!rows || rows.length === 0) return;
  const local = useCartStore.getState();
  const have = new Set(
    local.items.map((i) => lineKey(i.product.sku, i.variantId))
  );
  const addItem = local.addItem;
  for (const row of rows) {
    let product = null;
    try {
      product = await fetchProductById(row.product_id);
    } catch {
      continue;
    }
    if (!product || !product.sku) continue;
    if (have.has(lineKey(product.sku, row.variant_key || undefined))) continue;
    try {
      addItem(product as unknown as Product, row.quantity, row.variant_key || undefined, row.shade || undefined);
      have.add(lineKey(product.sku, row.variant_key || undefined));
    } catch {
      /* keep going */
    }
  }
}

/** Login handoff: push guest cart up, then union server rows down. */
export async function syncCartOnLogin(): Promise<void> {
  if (!loggedIn()) return;
  await pushLocalCartToServer();
  await pullServerCartIntoStore();
}

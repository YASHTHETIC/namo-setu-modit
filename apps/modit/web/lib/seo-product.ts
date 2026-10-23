/**
 * Server-only module (imported exclusively from Server Components).
 *
 * Server product lookup for SEO surfaces (metadata, JSON-LD, sitemap).
 *
 * 1. Static catalog (`lib/product-data.ts`) — this is the storefront's
 *    single source of truth: `backend/app/seeders/catalog.py` seeds the
 *    Postgres catalog from exactly this file, keeping ids/prices/skus
 *    aligned, so static data is an accurate mirror of live listings.
 * 2. API fallback (`GET /modit/products/{id}`) — covers products added
 *    through the admin panel after the catalog seed. Resolved by DB id
 *    (the API's lookup key); URLs with fresh slugs are not resolvable
 *    server-side and will 404 (same behavior the client UI shows today).
 */

import { products, type Product } from "@/lib/product-data";
import type { ProductDetailRead } from "@foundation/api-client";

const INTERNAL_API_BASE =
  process.env.MODIT_API_INTERNAL || "http://127.0.0.1:8000";

export type SeoProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  categorySlug: string;
  brand: string | null;
  description: string;
  shortDescription: string;
  price: number;
  mrp: number | null;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  source: "static" | "api";
};

function fromStatic(p: Product): SeoProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    category: p.category,
    categorySlug: p.categorySlug,
    brand: p.brand,
    description: p.description,
    shortDescription: p.shortDescription,
    price: p.price,
    mrp: p.mrp,
    inStock: p.inStock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    images: p.images,
    source: "static",
  };
}

async function fetchApiProduct(id: string): Promise<SeoProduct | null> {
  try {
    const res = await fetch(`${INTERNAL_API_BASE}/api/v1/modit/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as ProductDetailRead;
    return {
      id: d.id,
      slug: d.slug || d.sku,
      name: d.name,
      sku: d.sku,
      category: d.category?.name || "",
      categorySlug: d.category?.slug || "",
      brand: d.brand?.name || null,
      description: d.description || d.name,
      shortDescription: d.description || "",
      price: d.list_price ?? 0,
      mrp: d.mrp ?? null,
      // Inventory state is not exposed on the detail payload: omit nothing,
      // default to in-stock only for offers JSON — client UI shows live stock.
      inStock: true,
      rating: 0,
      reviewCount: 0,
      // Image URLs live behind media ids we cannot resolve server-side;
      // metadata/OG falls back to the site default image.
      images: [],
      source: "api",
    };
  } catch {
    return null;
  }
}

export async function getSeoProduct(idOrSlug: string): Promise<SeoProduct | null> {
  const p = products.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
  if (p) return fromStatic(p);
  return fetchApiProduct(idOrSlug);
}

/** Only products that legitimately belong in search indexes. */
export function isIndexableProductId(id: string): boolean {
  const JUNK_EXPLICIT =
    /item-\d+-\d+|photoroom|images-\d+|exhaust-item-\d+|shopping|600x600|wb-444|wash-basin-02c/i;
  const JUNK_AMAZON_SIZE = /-(ac-(uf|ul)\d+|sx\d+|ql\d+|xxlarge)(-|$)/i;
  const JUNK_UUID = /[0-9a-f]{8}-[0-9a-f]{4}/i;
  if (JUNK_EXPLICIT.test(id) || JUNK_AMAZON_SIZE.test(id) || JUNK_UUID.test(id)) {
    return false;
  }
  return !id.split("-").some(
    (seg) => seg.length >= 8 && /\d/.test(seg[0]) && (seg.match(/[a-z]/gi) || []).length >= 3
  );
}

export function indexableProducts(): Product[] {
  return products.filter((p) => isIndexableProductId(p.id));
}

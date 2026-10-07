import type { MetadataRoute } from "next";
import { products } from "@/lib/product-data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://modit.in";

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/cart", changeFrequency: "monthly", priority: 0.3 },
  { path: "/checkout", changeFrequency: "monthly", priority: 0.3 },
  { path: "/orders", changeFrequency: "weekly", priority: 0.4 },
  { path: "/rfq", changeFrequency: "weekly", priority: 0.6 },
  { path: "/calculator", changeFrequency: "monthly", priority: 0.5 },
  { path: "/wishlist", changeFrequency: "monthly", priority: 0.3 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/shipping", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Keep scraper-style placeholder slugs OUT of the sitemap so Google spends
 * crawl budget on real products (brand ranking signal). Conservative rules:
 * only matches obvious junk (placeholders, raw filenames, Amazon size
 * tokens, UUIDs, hash-like segments). Real model numbers (GA4030K,
 * SHR20855, 20L, T03…) never match — verified against the full catalog.
 */
const JUNK_EXPLICIT =
  /item-\d+-\d+|photoroom|images-\d+|exhaust-item-\d+|shopping|600x600|wb-444|wash-basin-02c/i;
const JUNK_AMAZON_SIZE = /-(ac-(uf|ul)\d+|sx\d+|ql\d+|xxlarge)(-|$)/i;
const JUNK_UUID = /[0-9a-f]{8}-[0-9a-f]{4}/i;

function isIndexableProductId(id: string): boolean {
  if (JUNK_EXPLICIT.test(id) || JUNK_AMAZON_SIZE.test(id) || JUNK_UUID.test(id)) {
    return false;
  }
  return !id.split("-").some(
    (seg) => seg.length >= 8 && /\d/.test(seg[0]) && (seg.match(/[a-z]/gi) || []).length >= 3
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => isIndexableProductId(p.id))
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  return [...staticEntries, ...productEntries];
}

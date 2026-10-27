import type { MetadataRoute } from "next";

import { indexableProducts } from "@/lib/seo-product";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://modit.in";

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/rfq", changeFrequency: "weekly", priority: 0.6 },
  { path: "/calculator", changeFrequency: "monthly", priority: 0.5 },
  { path: "/projects", changeFrequency: "weekly", priority: 0.5 },
  { path: "/supplier/apply", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/shipping", changeFrequency: "yearly", priority: 0.2 },
  { path: "/returns", changeFrequency: "yearly", priority: 0.2 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Keep scraper-style placeholder slugs OUT of the sitemap so Google spends
 * crawl budget on real products (brand ranking signal). Conservative rules:
 * only matches obvious junk (placeholders, raw filenames, Amazon size
 * tokens, UUIDs, hash-like segments). Real model numbers (GA4030K,
 * SHR20855, 20L, T03…) never match — verified against the full catalog.
 * The matcher lives in lib/seo-product (isIndexableProductId).
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
  // Real per-product timestamps — stamping everything "today" on every build
  // teaches Google that lastModified is noise and slows re-crawling.
  const productEntries: MetadataRoute.Sitemap = indexableProducts()
    // Filter on the stable id (junk rules were verified against ids — full
    // slugs contain real model numbers like 35783nkpm that trip the segment
    // rule), but emit slug URLs to match internal productLink().
    .map((p) => ({
      url: `${SITE_URL}/products/${p.slug || p.id}`,
      // Omit lastModified when the catalog has no real timestamp — a fake
      // "today" on every build is worse than no field at all.
      ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  return [...staticEntries, ...productEntries];
}

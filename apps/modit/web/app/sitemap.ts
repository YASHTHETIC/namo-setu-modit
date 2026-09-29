import type { MetadataRoute } from "next";
import { products } from "@/lib/product-data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://modit-web-prod.vercel.app";

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  return [...staticEntries, ...productEntries];
}

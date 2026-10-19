import type { Metadata } from "next";

import { categories } from "@/lib/product-data";

import ProductExplorer from "./product-explorer";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function categoryLabel(slug: string): string {
  const known = categories.find((c) => c.slug === slug);
  if (known) return known.name;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const category = first(sp.category);
  const search = first(sp.search) || first(sp.q);

  let title = "Construction Materials — Cement, Paint, Lighting & Tiling";
  let description =
    "Browse cement, paint, lighting, tiles and more at MODIT. Live prices, GST invoices and delivery to your site.";
  if (category) {
    const label = categoryLabel(category);
    title = `${label} — Buy Online`;
    description = `Buy ${label} online at best prices with fast delivery. Live stock, GST invoice and site delivery from MODIT.`;
  } else if (search) {
    title = `Search results for \u201C${search}\u201D`;
    description = `Search results for \u201C${search}\u201D on MODIT — compare prices across cement, paint, lighting, tiling and more.`;
  }

  return {
    title,
    description,
    alternates: { canonical: "/products" },
    openGraph: { title, description, url: "/products", siteName: "MODIT", locale: "en_IN" },
  };
}

export default function ProductsPage() {
  return <ProductExplorer />;
}

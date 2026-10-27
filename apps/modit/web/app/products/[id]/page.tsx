import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeoProduct } from "@/lib/seo-product";
import { products } from "@/lib/product-data";
import { safeJsonLd } from "@/lib/utils";

import ProductDetailClient from "./product-detail-client";

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://modit.in";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const p = await getSeoProduct(id);
  if (!p) {
    return { title: "Product not found", robots: { index: false, follow: true } };
  }
  // Prefer the real copy; when it's too thin for a snippet, compose a
  // factual fallback (name, brand, category, price, delivery promise).
  const short = (p.shortDescription || p.description || "").trim();
  const description = (
    short.length >= 80
      ? short
      : `${p.name} — ${p.brand ? `${p.brand} ` : ""}${p.category || "construction material"} at ₹${p.price} on MODIT. 60-minute delivery, GST invoice, COD available.`
  ).slice(0, 160);
  const url = `/products/${p.slug || p.id}`;
  // Price display = price charged (checkout re-validates against the DB).
  const ogImage = p.images[0];
  return {
    title: p.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: p.name,
      description,
      url,
      siteName: "MODIT",
      locale: "en_IN",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 600, height: 600, alt: p.name }] } : { images: ["https://modit.in/og-image.png"] }),
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description,
      ...(ogImage ? { images: [ogImage] } : { images: ["https://modit.in/og-image.png"] }),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const p = await getSeoProduct(id);
  if (!p) notFound();

  const productUrl = `${SITE_URL}/products/${p.slug || p.id}`;
  const productImages = p.images.slice(0, 5).map((src) =>
    src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`
  );
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.shortDescription || p.description,
        sku: p.sku,
        ...(productImages.length ? { image: productImages } : {}),
        category: p.category,
        ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
        ...(p.reviewCount > 0 && p.rating > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: p.rating,
                reviewCount: p.reviewCount,
              },
            }
          : {}),
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "INR",
          price: String(p.price),
          availability: p.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }
    : null;

  const breadcrumbLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: p.category,
            item: p.categorySlug
              ? `${SITE_URL}/products?category=${p.categorySlug}`
              : `${SITE_URL}/products`,
          },
          { "@type": "ListItem", position: 3, name: p.name, item: productUrl },
        ],
      }
    : null;

  // Server-resolved static product: ships the real H1/name/price in the
  // SSR HTML (Googlebot + first paint) instead of a skeleton. The client's
  // live `useProduct` result still takes precedence once it lands, and
  // admin-added API-only products simply have no initialProduct here.
  const initialProduct = products.find((x) => x.id === id || x.slug === id) ?? undefined;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
        />
      )}
      <ProductDetailClient params={params} initialProduct={initialProduct} />
    </>
  );
}

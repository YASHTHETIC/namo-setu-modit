import type { Metadata } from "next";

import { products } from "@/lib/product-data";
import { safeJsonLd } from "@/lib/utils";

import ProductDetailClient from "./product-detail-client";

type PageProps = { params: Promise<{ id: string }> };

function findBySlugOrId(idOrSlug: string) {
  return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const p = findBySlugOrId(id);
  if (!p) {
    return { title: "Product not found" };
  }
  const description = (p.shortDescription || p.description || "").slice(0, 160);
  const url = `/products/${p.slug || p.id}`;
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
      ...(ogImage ? { images: [{ url: ogImage, width: 600, height: 600, alt: p.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const p = findBySlugOrId(id);
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.shortDescription || p.description,
        sku: p.sku,
        image: p.images.slice(0, 3),
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
          url: `https://modit.in/products/${p.slug || p.id}`,
          priceCurrency: "INR",
          price: String(p.price),
          availability: p.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <ProductDetailClient params={params} />
    </>
  );
}

"use client";

import Link from "next/link";
import type { Product } from "@/lib/product-data";
import { ProductCard } from "./product-card";

interface ProductRailProps {
  title: string;
  products: Product[];
  seeAllHref?: string;
  accentColor?: "pink" | "green" | "cyan" | "purple";
}

export function ProductRail({
  title,
  products,
  seeAllHref,
  accentColor = "green",
}: ProductRailProps) {
  const colorMap = {
    pink: "text-[#E91E63]",
    green: "text-[#7CB518]",
    cyan: "text-[#00BCD4]",
    purple: "text-[#2D1B69]",
  };

  return (
    <section className="mt-4">
      {/* Section header */}
      <div className="section-header">
        <h2>{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className={colorMap[accentColor]}>
            See all →
          </Link>
        )}
      </div>

      {/* Horizontal scroll rail */}
      <div className="scroll-rail px-4">
        {products.map((product) => (
          <div key={product.id} className="w-[140px] flex-shrink-0">
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

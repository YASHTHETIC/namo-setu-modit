"use client";

import { useRef, useState, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const colorMap = {
    pink: "text-[#E91E63]",
    green: "text-[#7CB518]",
    cyan: "text-[#00BCD4]",
    purple: "text-[#2D1B69]",
  };

  const bgMap = {
    pink: "bg-[#E91E63]",
    green: "bg-[#7CB518]",
    cyan: "bg-[#00BCD4]",
    purple: "bg-[#2D1B69]",
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  return (
    <section className="mt-3 sm:mt-4 relative group/rail">
      {/* Section header — clean title with natural horizontal scroll */}
      <div className="section-header">
        <h2>{title}</h2>
      </div>

      {/* Left fade gradient */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#F8F6FC] to-transparent z-10 pointer-events-none" />
      )}
      {/* Right fade gradient */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#F8F6FC] to-transparent z-10 pointer-events-none" />
      )}

      {/* Horizontal scroll rail */}
      <div
        ref={scrollRef}
        className="scroll-rail"
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[140px] sm:w-[168px] flex-shrink-0"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

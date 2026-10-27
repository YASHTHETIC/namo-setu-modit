"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="mt-3 sm:mt-4 relative group/rail">
      {/* Section header with slider controls in place of See all */}
      <div className="section-header flex items-center justify-between">
        <h2>{title}</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
            disabled={!canScrollLeft}
            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[#DDD6EE] bg-white shadow-2xs flex items-center justify-center text-[#150726] transition-all hover:scale-105 active:scale-95 ${
              canScrollLeft ? "hover:bg-[#7CB518] hover:text-white hover:border-[#7CB518] cursor-pointer" : "opacity-30 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={`Scroll ${title} right`}
            disabled={!canScrollRight}
            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[#DDD6EE] bg-white shadow-2xs flex items-center justify-center text-[#150726] transition-all hover:scale-105 active:scale-95 ${
              canScrollRight ? "hover:bg-[#7CB518] hover:text-white hover:border-[#7CB518] cursor-pointer" : "opacity-30 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Scroll arrows — visible on hover */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 top-[50%] -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/95 border border-[#DDD6EE] shadow-lg hidden lg:flex items-center justify-center text-[#150726] hover:bg-[#7CB518] hover:text-white hover:border-[#7CB518] transition-all opacity-0 group-hover/rail:opacity-100 hover:scale-110 active:scale-95 backdrop-blur-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 top-[50%] -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/95 border border-[#DDD6EE] shadow-lg hidden lg:flex items-center justify-center text-[#150726] hover:bg-[#7CB518] hover:text-white hover:border-[#7CB518] transition-all opacity-0 group-hover/rail:opacity-100 hover:scale-110 active:scale-95 backdrop-blur-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

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

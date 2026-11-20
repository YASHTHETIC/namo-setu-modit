"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
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
    <section className="mt-4 sm:mt-6 relative group/rail">
      {/* Section header — title with subtle accent line and See All link */}
      <div className="section-header flex items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-1 rounded-full bg-[#7CB518] shadow-[0_0_8px_#7CB518]" />
          <h2 className="text-body-md sm:text-title-md font-black text-[#150726] tracking-tight">{title}</h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1 text-caption sm:text-body-sm font-extrabold text-[#7CB518] hover:text-[#5A8010] transition-colors group/link"
          >
            <span>See all</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Desktop Navigation Arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy("left")}
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#150726] shadow-xl border border-[#DDD6EE] opacity-0 group-hover/rail:opacity-100 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#150726] shadow-xl border border-[#DDD6EE] opacity-0 group-hover/rail:opacity-100 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Left/Right Edge Fades */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F8F6FC] to-transparent z-10 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8F6FC] to-transparent z-10 pointer-events-none" />
      )}

      {/* Horizontal scroll rail */}
      <div
        ref={scrollRef}
        className="scroll-rail py-2"
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[160px] sm:w-[185px] md:w-[200px] flex-shrink-0"
            style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
          >
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

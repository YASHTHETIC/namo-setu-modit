"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Clock, ArrowRight, Flame, Package, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts, type Product } from "@/lib/api-hooks";
import { useCartStore } from "@/lib/cart-store";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useDisplayProducts } from "@/lib/pricing";
import { formatINR, productLink } from "@/lib/utils";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { Particles3DVfx } from "@/components/particles-3d-vfx";

function DigitalCountdown({ target }: { target: number }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [target]);

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 font-mono select-none">
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/90 border border-[#F8CB46]/40 text-caption sm:text-body-sm font-black text-[#F8CB46] shadow-[0_0_12px_rgba(248,203,70,0.35)] tabular-nums">
          {String(time.h).padStart(2, "0")}
        </span>
        <span className="text-tiny font-black text-white/60 uppercase mt-0.5">HRS</span>
      </div>
      <span className="text-caption sm:text-body-sm font-black text-[#F8CB46]/80 -mt-3.5">:</span>
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/90 border border-[#F8CB46]/40 text-caption sm:text-body-sm font-black text-[#F8CB46] shadow-[0_0_12px_rgba(248,203,70,0.35)] tabular-nums">
          {String(time.m).padStart(2, "0")}
        </span>
        <span className="text-tiny font-black text-white/60 uppercase mt-0.5">MIN</span>
      </div>
      <span className="text-caption sm:text-body-sm font-black text-[#F8CB46]/80 -mt-3.5">:</span>
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/90 border border-[#E91E63]/60 text-caption sm:text-body-sm font-black text-[#E91E63] shadow-[0_0_12px_rgba(233,30,99,0.45)] tabular-nums">
          {String(time.s).padStart(2, "0")}
        </span>
        <span className="text-tiny font-black text-[#E91E63] uppercase mt-0.5">SEC</span>
      </div>
    </div>
  );
}

export function FlashDeals() {
  const tryAdd = useAddToCart();
  const items = useCartStore((s) => s.items);
  const { data: allProducts = [] } = useProducts({ page_size: 2000 });
  const allProductsList = useDisplayProducts(allProducts as Product[]);
  const [optionsFor, setOptionsFor] = useState<(typeof allProductsList)[number] | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const flashProducts = allProductsList
    .filter((p) => p.discount >= 20 && p.inStock)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 10);

  const [targetTime] = useState(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  });

  const scrollRail = (direction: "left" | "right") => {
    if (railRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      railRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (flashProducts.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1600px] lg:w-[84vw] px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
      <div
        className="rounded-3xl overflow-hidden relative border border-white/20 shadow-[0_20px_50px_rgba(21,7,38,0.5)]"
        style={{ background: "linear-gradient(135deg, #0b0318 0%, #150726 35%, #2D1B69 70%, #150726 100%)" }}
      >
        {/* Solid Multi-tone Neon Accent Top Line (No moving or strobing lasers) */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#F8CB46] via-[#E91E63] to-[#7CB518] z-20" />

        {/* 3D Holographic Particle Matrix VFX */}
        <Particles3DVfx particleCount={20} speed={0.5} />

        {/* Ambient static fluid glow orbs (zero pulse, calm and steady) */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[#F8CB46]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#E91E63]/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-[#00BCD4]/10 blur-3xl" />

        {/* Header HUD */}
        <div className="px-4 sm:p-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-white/10 relative z-10 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-[#F8CB46]/25 via-[#E91E63]/25 to-[#7CB518]/20 border border-[#F8CB46]/40 flex items-center justify-center shadow-[0_0_16px_rgba(248,203,70,0.3)]">
              <Flame className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-[#F8CB46]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E91E63] shadow-[0_0_8px_#E91E63]" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-body-md sm:text-title-md font-black text-white flex items-center gap-1.5 sm:gap-2 tracking-tight">
                  Flash Deals Console
                  <Zap className="h-4 w-4 text-[#F8CB46] fill-[#F8CB46] drop-shadow-[0_0_8px_#F8CB46]" />
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E91E63]/20 border border-[#E91E63]/50 text-tiny font-black text-white uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E91E63] shadow-[0_0_6px_#E91E63]" />
                  Live Drops
                </span>
              </div>
              <p className="text-tiny text-white/70 leading-tight mt-0.5">
                Lightning mill rates &middot; Verified batch allocation &middot; 60-min dispatch
              </p>
            </div>
          </div>

          {/* Precision Digital Countdown Timer & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/70 border border-white/15 rounded-2xl px-3 sm:px-4 py-2 shadow-glass-specular backdrop-blur-xl">
              <Clock className="h-4 w-4 text-[#F8CB46] hidden xs:block" />
              <DigitalCountdown target={targetTime} />
            </div>

            {/* Desktop Quick Nav Arrows */}
            <div className="hidden md:flex items-center gap-1.5 ml-1">
              <button
                onClick={() => scrollRail("left")}
                aria-label="Scroll left"
                className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollRail("right")}
                aria-label="Scroll right"
                className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products rail — snap scroll on all devices */}
        <div
          ref={railRef}
          className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-hide snap-x pb-4 pt-4 px-4 relative z-10 scroll-smooth"
        >
          {flashProducts.map((product) => {
            const inCart = items.some((i) => i.product.id === product.id);
            const optLabel = optionsLabel(product);
            const hash = product.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const claimedPercent = 65 + (hash % 28);

            return (
              <div
                key={product.id}
                className="w-[158px] min-[390px]:w-[172px] sm:w-[204px] md:w-[220px] xl:w-[232px] flex-shrink-0 snap-start bg-[#0b0318]/85 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden hover:border-[#F8CB46]/80 hover:shadow-[0_20px_40px_-6px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 transition-all duration-300 group specular-sheen"
              >
                {/* Elevated Uniform Frosted Studio Showcase Pad */}
                <Link
                  href={productLink(product)}
                  className="product-thumb-blend block relative aspect-square m-2 sm:m-2.5 rounded-xl bg-[#F8F6FC] p-2 sm:p-2.5 shadow-sm overflow-hidden group/thumb"
                >
                  <div className="product-image-shine" />
                  {product.images[0] ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 172px, 232px"
                        quality={85}
                        loading="lazy"
                        draggable={false}
                        className="object-contain p-1.5 transition-transform duration-300 group-hover/thumb:scale-105"
                      />
                    </div>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-stone-100">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 text-[#2D1B69]/40" />
                    </span>
                  )}

                  {product.discount > 0 && (
                    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-lg bg-gradient-to-r from-[#E91E63] to-[#AD1457] px-2 py-0.5 text-tiny font-black text-white shadow-md border border-white/30">
                      -{product.discount}% OFF
                    </span>
                  )}
                </Link>

                <div className="p-3 pt-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-tiny font-black text-[#7CB518] uppercase tracking-wider truncate">
                      {product.brand}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-tiny font-bold text-[#F8CB46] bg-[#F8CB46]/10 px-1.5 py-0.2 rounded border border-[#F8CB46]/25 shrink-0">
                      ⚡ DROP
                    </span>
                  </div>

                  <Link href={productLink(product)}>
                    <h3 className="text-caption sm:text-body-sm font-bold text-white leading-snug line-clamp-2 min-h-[34px] group-hover:text-[#F8CB46] transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price & Savings */}
                  <div className="mt-2 flex items-baseline justify-between gap-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
                      <span className="text-body-md font-black text-[#7CB518] drop-shadow-[0_0_8px_rgba(124,181,24,0.35)] tabular-nums whitespace-nowrap">
                        {formatINR(product.price)}
                      </span>
                      {product.mrp > product.price && (
                        <span className="text-tiny text-white/50 line-through tabular-nums whitespace-nowrap">
                          {formatINR(product.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batch Allocation Progress */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-tiny font-bold text-white/70">
                      <span className="text-white/60">Batch Claimed</span>
                      <span className="text-[#F8CB46] font-mono">{claimedPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7CB518] via-[#F8CB46] to-[#E91E63]"
                        style={{ width: `${claimedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="mt-3">
                    <button
                      onClick={() => { tryAdd(product); }}
                      className={`w-full py-2 rounded-xl text-tiny font-black tracking-wider uppercase transition-all cursor-pointer ${
                        inCart
                          ? "bg-[#7CB518]/25 text-[#7CB518] border border-[#7CB518]/60 shadow-[0_0_12px_rgba(124,181,24,0.25)]"
                          : "bg-gradient-to-r from-[#7CB518] to-[#5A8010] hover:brightness-110 text-white shadow-[0_4px_12px_rgba(124,181,24,0.3)] active:scale-95"
                      }`}
                    >
                      {inCart ? "IN CART ✓" : "ADD TO CART"}
                    </button>
                    {optLabel && (
                      <button
                        onClick={() => setOptionsFor(product)}
                        className="mt-1.5 w-full py-1 rounded-lg text-tiny font-bold bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                      >
                        {optLabel} ▾
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 text-center relative z-10 bg-black/25 backdrop-blur-md">
          <Link
            href="/products?sort=discount"
            className="inline-flex items-center gap-2 text-caption sm:text-body-sm font-black text-[#F8CB46] hover:text-white transition-colors group/link"
          >
            <Sparkles className="h-4 w-4 text-[#F8CB46]" />
            <span>View all limited lightning deals</span>
            <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </div>

      {optionsFor && (
        <VariantOptionsModal
          open={Boolean(optionsFor)}
          onClose={() => setOptionsFor(null)}
          product={optionsFor}
        />
      )}
    </div>
  );
}

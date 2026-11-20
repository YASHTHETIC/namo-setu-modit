"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Clock, ArrowRight, Flame, Package, Sparkles } from "lucide-react";
import { useProducts, type Product } from "@/lib/api-hooks";
import { useCartStore } from "@/lib/cart-store";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useDisplayProducts } from "@/lib/pricing";
import { productLink } from "@/lib/utils";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { BorderBeam } from "@/components/border-beam";

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
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/80 border border-[#F8CB46]/40 text-caption sm:text-body-sm font-black text-[#F8CB46] shadow-[0_0_12px_rgba(248,203,70,0.35)] tabular-nums">
          {String(time.h).padStart(2, "0")}
        </span>
        <span className="text-tiny font-black text-white/50 uppercase mt-0.5">H</span>
      </div>
      <span className="text-caption sm:text-body-sm font-black text-[#F8CB46] animate-pulse -mt-3.5">:</span>
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/80 border border-[#F8CB46]/40 text-caption sm:text-body-sm font-black text-[#F8CB46] shadow-[0_0_12px_rgba(248,203,70,0.35)] tabular-nums">
          {String(time.m).padStart(2, "0")}
        </span>
        <span className="text-tiny font-black text-white/50 uppercase mt-0.5">M</span>
      </div>
      <span className="text-caption sm:text-body-sm font-black text-[#F8CB46] animate-pulse -mt-3.5">:</span>
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-black/80 border border-[#E91E63]/50 text-caption sm:text-body-sm font-black text-[#E91E63] shadow-[0_0_12px_rgba(233,30,99,0.45)] tabular-nums">
          {String(time.s).padStart(2, "0")}
        </span>
        <span className="text-tiny font-black text-[#E91E63]/80 uppercase mt-0.5">S</span>
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

  const flashProducts = allProductsList
    .filter((p) => p.discount >= 20 && p.inStock)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8);

  const endTime = new Date();
  endTime.setHours(23, 59, 59, 999);

  if (flashProducts.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1600px] lg:w-[84vw] px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
      <div className="rounded-3xl overflow-hidden relative border border-white/15 shadow-[0_20px_50px_rgba(21,7,38,0.5)]" style={{ background: "linear-gradient(135deg, #0b0318 0%, #150726 35%, #2D1B69 70%, #150726 100%)" }}>
        {/* Dual Opposing Traveling Laser Glow Beams */}
        <BorderBeam duration={6} colorFrom="#F8CB46" colorTo="#E91E63" borderWidth={2} />
        <BorderBeam duration={6} delay={-3} reverse={true} colorFrom="#00BCD4" colorTo="#7CB518" borderWidth={2} />

        {/* Ambient fluid glow orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[#F8CB46]/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#E91E63]/25 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-[#00BCD4]/15 blur-3xl" />

        {/* Header HUD */}
        <div className="px-4 sm:p-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-white/10 relative z-10 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-[#F8CB46]/30 via-[#E91E63]/30 to-[#7CB518]/20 border border-[#F8CB46]/50 flex items-center justify-center shadow-[0_0_20px_rgba(248,203,70,0.4)] animate-pulse">
              <Flame className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-[#F8CB46]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E91E63] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E91E63]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-body-md sm:text-title-md font-black text-white flex items-center gap-1.5 sm:gap-2 tracking-tight">
                  Flash Deals Console
                  <Zap className="h-4 w-4 text-[#F8CB46] fill-[#F8CB46] drop-shadow-[0_0_10px_#F8CB46]" />
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E91E63]/20 border border-[#E91E63]/40 text-tiny font-black text-white uppercase tracking-wider">
                  Live Drops
                </span>
              </div>
              <p className="text-tiny text-white/70 leading-tight mt-0.5">Lightning mill rates &middot; Verified batch allocation &middot; 60-min dispatch</p>
            </div>
          </div>

          {/* Precision Digital Countdown Timer */}
          <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl px-3 sm:px-4 py-2 shadow-glass-specular backdrop-blur-xl">
            <Clock className="h-4 w-4 text-[#F8CB46] hidden xs:block" />
            <DigitalCountdown target={endTime.getTime()} />
          </div>
        </div>

        {/* Products rail — snap scroll on all sizes */}
        <div className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-hide snap-x pb-4 pt-4 px-4 relative z-10">
          {flashProducts.map((product) => {
            const inCart = items.some((i) => i.product.id === product.id);
            const optLabel = optionsLabel(product);
            return (
              <div
                key={product.id}
                className="w-[172px] sm:w-[208px] flex-shrink-0 snap-start bg-[#0b0318]/70 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden hover:border-[#F8CB46]/80 hover:shadow-[0_20px_40px_-6px_rgba(248,203,70,0.35)] hover:-translate-y-2 transition-all duration-300 group specular-sheen card-3d-inner transform-3d"
              >
                <Link href={productLink(product)} className="block relative aspect-square bg-gradient-to-b from-white/10 to-transparent p-2.5 overflow-hidden transform-3d">
                  {product.images[0] ? (
                    <div className="relative h-full w-full layer-3d-pop">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 46vw, 190px"
                        loading="lazy"
                        draggable={false}
                        className="object-contain p-2 animate-fade-in group-hover:scale-110 drop-shadow-[0_12px_18px_rgba(0,0,0,0.4)] transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 text-white/20" />
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="layer-3d-badge absolute top-2.5 left-2.5 z-10 inline-flex items-center rounded-xl bg-gradient-to-r from-[#7CB518] to-[#5A8010] px-2.5 py-0.5 text-tiny font-black tracking-tight text-white shadow-cyber-green border border-white/20">
                      {product.discount}% OFF
                    </span>
                  )}
                </Link>

                <div className="p-3">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-tiny font-black text-[#7CB518] uppercase truncate leading-none tracking-wider">{product.brand}</p>
                    <span className="text-tiny text-[#F8CB46] font-bold">⚡ Limited</span>
                  </div>
                  <Link href={productLink(product)}>
                    <p className="text-micro sm:text-tiny font-bold text-white leading-tight line-clamp-2 min-h-[28px] mt-1.5 hover:text-[#7CB518] transition-colors">{product.name}</p>
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-2 min-w-0">
                    <span className="text-body-md font-black text-[#7CB518] truncate drop-shadow-[0_0_8px_rgba(124,181,24,0.4)]">₹{product.price.toLocaleString("en-IN")}</span>
                    <span className="text-tiny text-white/50 line-through truncate">₹{product.mrp.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="mt-2.5 min-h-[32px]">
                    <button
                      onClick={() => { tryAdd(product); }}
                      className={`btn-shine specular-sheen w-full py-2 rounded-xl text-tiny font-black tracking-wider uppercase transition-all shadow-sm cursor-pointer ${
                        inCart
                          ? "bg-[#7CB518]/25 text-[#7CB518] border border-[#7CB518]/60 shadow-cyber-green"
                          : "bg-gradient-to-r from-[#7CB518] to-[#5A8010] hover:opacity-95 text-white active:scale-95 shadow-cyber-green"
                      }`}
                    >
                      {inCart ? "IN CART" : "ADD TO CART"}
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
        <div className="px-4 py-3 border-t border-white/10 text-center relative z-10 bg-black/20 backdrop-blur-md">
          <Link href="/products?sort=discount" className="inline-flex items-center gap-1.5 text-caption font-black text-[#F8CB46] hover:text-white transition-colors group/link">
            <Sparkles className="h-3.5 w-3.5 text-[#F8CB46]" />
            <span>View all limited lightning deals</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1.5 transition-transform" />
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

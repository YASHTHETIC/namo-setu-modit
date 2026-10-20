"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Clock, ArrowRight, Flame, Package } from "lucide-react";
import { useProducts, type Product } from "@/lib/api-hooks";
import { useCartStore } from "@/lib/cart-store";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useDisplayProducts } from "@/lib/pricing";
import { productLink } from "@/lib/utils";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";

function Countdown({ target }: { target: number }) {
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
    <span className="tabular-nums font-mono">
      {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:{String(time.s).padStart(2, "0")}
    </span>
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
    <div className="mx-auto max-w-[1600px] lg:w-[84vw] px-4 pt-3 pb-2 sm:px-6 sm:pt-4 sm:pb-3">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #150726 0%, #2D1B69 50%, #150726 100%)" }}>
        {/* Header */}
        <div className="px-3 sm:p-4 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#F8CB46]/20 flex items-center justify-center animate-pulse">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F8CB46]" />
            </div>
            <div>
              <h2 className="text-body-sm sm:text-body-md font-extrabold text-white flex items-center gap-1.5 sm:gap-2">
                Flash Deals
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FF9800] fill-[#FF9800]" />
              </h2>
              <p className="text-tiny text-white/50 leading-tight">Limited time offers</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 sm:px-3 py-1">
            <Clock className="h-3 w-3 text-[#F8CB46]" />
            <span className="text-tiny sm:text-caption font-bold text-white">
              <Countdown target={endTime.getTime()} />
            </span>
          </div>
        </div>

        {/* Products rail — snap scroll on all sizes */}
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide snap-x pb-3 pt-3 px-3">
          {flashProducts.map((product) => {
            const inCart = items.some((i) => i.product.id === product.id);
            const optLabel = optionsLabel(product);
            return (
              <div key={product.id} className="w-[152px] sm:w-[180px] flex-shrink-0 snap-start bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#F8CB46]/50 transition-all group">
                <Link href={productLink(product)} className="block relative aspect-square bg-white/5 p-2">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 46vw, 180px" loading="lazy" draggable={false} className="object-contain animate-fade-in group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 text-white/20" />
                    </span>
                  )}
                  <span className="absolute top-1.5 left-1.5 bg-[#2D1B69] text-white text-micro font-bold px-1.5 py-0.5 rounded-full">
                    {product.discount}% OFF
                  </span>
                </Link>
                <div className="p-2">
                  <p className="text-tiny font-bold text-[#7CB518] uppercase truncate leading-none">{product.brand}</p>
                  <Link href={productLink(product)}>
                    <p className="text-micro sm:text-tiny font-semibold text-white leading-tight line-clamp-2 min-h-[24px] mt-1 hover:text-[#7CB518] transition-colors">{product.name}</p>
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-body-md font-extrabold text-[#7CB518]">₹{product.price.toLocaleString("en-IN")}</span>
                    <span className="text-tiny text-white/30 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-1.5 min-h-[30px]">
                    <button
                      onClick={() => { tryAdd(product); }}
                      className={`w-full py-1.5 rounded-lg text-tiny font-bold transition-all ${
                        inCart
                          ? "bg-[#7CB518]/20 text-[#7CB518]"
                          : "bg-[#7CB518] text-white hover:bg-[#6A9C14]"
                      }`}
                    >
                      {inCart ? "IN CART" : "ADD"}
                    </button>
                    {optLabel && (
                      <button
                        onClick={() => setOptionsFor(product)}
                        className="mt-1.5 w-full py-1 rounded-lg text-tiny font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
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
        <div className="px-3 py-2 border-t border-white/10 text-center">
          <Link href="/products?sort=discount" className="inline-flex items-center gap-1.5 text-micro font-bold text-[#F8CB46] hover:text-white transition-colors">
            View all deals <ArrowRight className="h-3 w-3" />
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

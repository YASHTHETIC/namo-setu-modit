"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Clock, ArrowRight, Flame } from "lucide-react";
import { useProducts, type Product } from "@/lib/api-hooks";
import { useCartStore } from "@/lib/cart-store";
import { useDisplayProducts } from "@/lib/pricing";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { useRequireLogin } from "@/lib/use-auth";

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
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const { data: allProducts = [] } = useProducts({});
  const allProductsList = useDisplayProducts(allProducts as Product[]);
  const [optionsFor, setOptionsFor] = useState<(typeof allProductsList)[number] | null>(null);
  const requireLogin = useRequireLogin();

  const flashProducts = allProductsList
    .filter((p) => p.discount >= 20 && p.inStock)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 6);

  const endTime = new Date();
  endTime.setHours(23, 59, 59, 999);

  if (flashProducts.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-4 pb-3 sm:px-6">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2D1B69 50%, #1a0a2e 100%)" }}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#E91E63]/20 flex items-center justify-center animate-pulse">
              <Flame className="h-4 w-4 text-[#E91E63]" />
            </div>
            <div>
              <h2 className="text-body-md font-extrabold text-white flex items-center gap-2">
                Flash Deals
                <Zap className="h-4 w-4 text-[#FF9800] fill-[#FF9800]" />
              </h2>
              <p className="text-tiny text-white/50">Limited time offers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
            <Clock className="h-3 w-3 text-[#E91E63]" />
            <span className="text-caption font-bold text-white">
              <Countdown target={endTime.getTime()} />
            </span>
          </div>
        </div>

        {/* Products rail — snap scroll on all sizes */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x px-4 pb-4">
          {flashProducts.map((product) => {
            const inCart = items.some((i) => i.product.id === product.id);
            const optLabel = optionsLabel(product);
            return (
              <div key={product.id} className="w-[160px] sm:w-[180px] flex-shrink-0 snap-start bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#E91E63]/40 transition-all group">
                <Link href={`/products/${product.id}`} className="block relative aspect-square bg-white/5 p-2">
                  <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, 180px" loading="lazy" draggable={false} className="object-contain animate-fade-in group-hover:scale-105 transition-transform" />
                  <span className="absolute top-1.5 left-1.5 bg-[#E91E63] text-white text-tiny font-bold px-1.5 py-0.5 rounded-full">
                    {product.discount}% OFF
                  </span>
                </Link>
                <div className="p-2.5">
                  <p className="text-tiny font-bold text-[#7CB518] uppercase truncate">{product.brand}</p>
                  <Link href={`/products/${product.id}`}>
                    <p className="text-micro font-semibold text-white leading-tight line-clamp-2 min-h-[28px] mt-0.5 hover:text-[#7CB518] transition-colors">{product.name}</p>
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-body-md font-extrabold text-[#7CB518]">₹{product.price.toLocaleString()}</span>
                    <span className="text-tiny text-white/30 line-through">₹{product.mrp.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 min-h-[70px]">
                    <button
                      onClick={() => { if (requireLogin()) addItem(product); }}
                      className={`w-full py-1.5 rounded-lg text-tiny font-bold transition-all ${
                        inCart
                          ? "bg-[#7CB518]/20 text-[#7CB518]"
                          : "bg-[#E91E63] text-white hover:bg-[#C2185B]"
                      }`}
                    >
                      {inCart ? "IN CART" : "ADD"}
                    </button>
                    {optLabel && (
                      <button
                        onClick={() => setOptionsFor(product)}
                        className="mt-1.5 w-full py-1.5 rounded-lg text-tiny font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
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
        <div className="p-3 border-t border-white/10 text-center">
          <Link href="/products?sort=discount" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E91E63] hover:text-white transition-colors">
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

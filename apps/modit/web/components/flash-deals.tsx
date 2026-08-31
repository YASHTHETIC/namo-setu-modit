"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, ArrowRight, Flame } from "lucide-react";
import { useProducts, type Product } from "@/lib/api-hooks";
import { useCartStore } from "@/lib/cart-store";

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
  const allProductsList = allProducts as Product[];

  const flashProducts = allProductsList
    .filter((p) => p.discount >= 20 && p.inStock)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 6);

  const endTime = new Date();
  endTime.setHours(23, 59, 59, 999);

  if (flashProducts.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2D1B69 50%, #1a0a2e 100%)" }}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#E91E63]/20 flex items-center justify-center animate-pulse">
              <Flame className="h-4 w-4 text-[#E91E63]" />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-white flex items-center gap-2">
                Flash Deals
                <Zap className="h-4 w-4 text-[#FF9800] fill-[#FF9800]" />
              </h2>
              <p className="text-[10px] text-white/50">Limited time offers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
            <Clock className="h-3 w-3 text-[#E91E63]" />
            <span className="text-[12px] font-bold text-white">
              <Countdown target={endTime.getTime()} />
            </span>
          </div>
        </div>

        {/* Products grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {flashProducts.map((product) => {
            const inCart = items.some((i) => i.product.id === product.id);
            return (
              <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#E91E63]/40 transition-all group">
                <div className="relative aspect-square bg-white/5 p-2">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" loading="lazy" />
                  <span className="absolute top-1.5 left-1.5 bg-[#E91E63] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {product.discount}% OFF
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-[9px] font-bold text-[#7CB518] uppercase">{product.brand}</p>
                  <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2 min-h-[28px] mt-0.5">{product.name}</p>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-[14px] font-extrabold text-[#7CB518]">₹{product.price.toLocaleString()}</span>
                    <span className="text-[10px] text-white/30 line-through">₹{product.mrp.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => addItem(product)}
                    className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      inCart
                        ? "bg-[#7CB518]/20 text-[#7CB518]"
                        : "bg-[#E91E63] text-white hover:bg-[#C2185B]"
                    }`}
                  >
                    {inCart ? "IN CART" : "ADD"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-center">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E91E63] hover:text-white transition-colors">
            View all deals <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

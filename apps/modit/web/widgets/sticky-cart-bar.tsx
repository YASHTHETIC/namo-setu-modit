"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useCartUi } from "@/lib/cart-ui";
import { useHideOnScroll } from "@/lib/use-hide-on-scroll";
import { BorderBeam } from "@/components/border-beam";

interface StickyCartBarProps {
  itemCount: number;
  total: number;
}

export function StickyCartBar({ itemCount, total }: StickyCartBarProps) {
  const items = useCartStore((s) => s.items);
  const openDrawer = useCartUi((s) => s.openDrawer);
  // Blinkit timing: bar slides away on scroll-down, comes back on scroll-up.
  const barHidden = useHideOnScroll(200);
  // Dismiss hides the bar until the cart itself changes (add/remove/price).
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  if (itemCount === 0) return null;

  const lastItem = items[items.length - 1];
  const saved = items.reduce((sum, i) => sum + (i.product.mrp - i.product.price) * i.quantity, 0);
  const key = `${itemCount}:${total}`;
  if (dismissedKey === key) return null;

  return (
    <div className={`sticky-cart-bar glass-cyber group/cart relative ${barHidden ? "bar-hidden" : ""}`}>
      {/* 2028 Traveling Laser Border */}
      <div className="absolute inset-0 rounded-[20px] overflow-hidden pointer-events-none">
        <BorderBeam duration={5} colorFrom="#7CB518" colorTo="#F8CB46" borderWidth={1.5} />
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissedKey(key)}
        aria-label="Hide cart bar"
        className="absolute -top-2.5 -left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#150726] shadow-md border border-black/10 transition-transform hover:scale-115 active:scale-90 cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Left side — mini product preview + totals */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mini product thumbnail */}
        {lastItem && (
          <div className="h-11 w-11 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex-shrink-0 group-hover/cart:scale-105 transition-transform duration-300 shadow-inner">
            {lastItem.product.images?.[0] ? (
              <Image src={lastItem.product.images[0]} alt="" width={44} height={44} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-tiny text-white/40">📦</div>
            )}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-md font-bold text-white">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-body-lg font-black text-[#7CB518] drop-shadow-[0_0_8px_rgba(124,181,24,0.4)]">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          {saved > 0 && (
            <span className="text-tiny font-bold text-[#F8CB46] drop-shadow-[0_0_6px_rgba(248,203,70,0.3)]">
              Saving ₹{saved.toLocaleString("en-IN")} 🎉
            </span>
          )}
        </div>
      </div>

      {/* Right side — CTA opens the quick cart drawer */}
      <button
        onClick={openDrawer}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7CB518] to-[#5A8010] text-white text-body-sm font-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(124,181,24,0.4)] border border-emerald-400/30 flex-shrink-0 cursor-pointer"
      >
        <span>View Cart</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

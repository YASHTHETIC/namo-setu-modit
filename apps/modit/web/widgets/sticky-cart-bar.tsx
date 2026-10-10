"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

interface StickyCartBarProps {
  itemCount: number;
  total: number;
}

export function StickyCartBar({ itemCount, total }: StickyCartBarProps) {
  const items = useCartStore((s) => s.items);
  // Dismiss hides the bar until the cart itself changes (add/remove/price).
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  if (itemCount === 0) return null;

  const lastItem = items[items.length - 1];
  const saved = items.reduce((sum, i) => sum + (i.product.mrp - i.product.price) * i.quantity, 0);
  const key = `${itemCount}:${total}`;
  if (dismissedKey === key) return null;

  return (
    <div className="sticky-cart-bar group/cart">
      {/* Dismiss — header cart icon always keeps the cart reachable */}
      <button
        onClick={() => setDismissedKey(key)}
        aria-label="Hide cart bar"
        className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#150726] shadow-md transition-transform hover:scale-110 active:scale-95"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {/* Left side — mini product preview + totals */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mini product thumbnail */}
        {lastItem && (
          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex-shrink-0 group-hover/cart:scale-110 transition-transform duration-200">
            {lastItem.product.images?.[0] ? (
              <Image src={lastItem.product.images[0]} alt="" width={40} height={40} loading="lazy" className="h-full w-full object-cover" />
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
            <span className="text-body-lg font-black text-[#7CB518]">₹{total.toLocaleString("en-IN")}</span>
          </div>
          {saved > 0 && (
            <span className="text-tiny font-semibold text-[#E91E63]">
              You&apos;re saving ₹{saved.toLocaleString("en-IN")} 🎉
            </span>
          )}
        </div>
      </div>

      {/* Right side — CTA */}
      <Link
        href="/cart"
        className="btn-shine inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#7CB518] text-white text-body-sm font-bold hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 flex-shrink-0"
      >
        View Cart
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

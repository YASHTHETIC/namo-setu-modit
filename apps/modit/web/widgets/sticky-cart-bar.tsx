"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

interface StickyCartBarProps {
  itemCount: number;
  total: number;
}

export function StickyCartBar({ itemCount, total }: StickyCartBarProps) {
  const items = useCartStore((s) => s.items);
  if (itemCount === 0) return null;

  const lastItem = items[items.length - 1];
  const saved = items.reduce((sum, i) => sum + (i.product.mrp - i.product.price) * i.quantity, 0);

  return (
    <div className="sticky-cart-bar group/cart">
      {/* Left side — mini product preview + totals */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mini product thumbnail */}
        {lastItem && (
          <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex-shrink-0 group-hover/cart:scale-110 transition-transform duration-200">
            {lastItem.product.images?.[0] ? (
              <img src={lastItem.product.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-white/40">📦</div>
            )}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-white">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-[15px] font-black text-[#7CB518]">₹{total.toLocaleString("en-IN")}</span>
          </div>
          {saved > 0 && (
            <span className="text-[10px] font-semibold text-[#E91E63]">
              You&apos;re saving ₹{saved.toLocaleString("en-IN")} 🎉
            </span>
          )}
        </div>
      </div>

      {/* Right side — CTA */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7CB518] text-white text-[13px] font-bold hover:bg-[#6A9C14] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 flex-shrink-0"
      >
        View Cart
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

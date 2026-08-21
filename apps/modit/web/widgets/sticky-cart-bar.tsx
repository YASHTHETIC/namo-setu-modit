"use client";

import Link from "next/link";

interface StickyCartBarProps {
  itemCount: number;
  total: number;
}

export function StickyCartBar({ itemCount, total }: StickyCartBarProps) {
  if (itemCount === 0) return null;

  return (
    <div className="sticky-cart-bar">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="text-[14px] text-[#9B8CB5]">·</span>
        <span className="text-[14px] font-bold">₹{total.toLocaleString("en-IN")}</span>
      </div>
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7CB518] text-white text-[13px] font-semibold hover:bg-[#6A9C14] transition-colors"
      >
        View Cart
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

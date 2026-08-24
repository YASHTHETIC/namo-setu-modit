"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const existing = items.find((i) => i.product.id === product.id);
  const qty = existing?.quantity ?? 0;
  const [flashing, setFlashing] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setFlashing(true);
    setJustAdded(true);
    setTimeout(() => setFlashing(false), 400);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const removeItem = useCartStore.getState().removeItem;
    removeItem(product.id);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={`product-card flex flex-col ${compact ? "w-[140px]" : "w-full"} group/card`}
    >
      {/* Image zone */}
      <div className="relative bg-[#F0ECF9] aspect-square overflow-hidden">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
            loading="lazy"
          />
        )}

        {/* Discount badge — pink pill, top-left */}
        {discount > 0 && (
          <span className="badge-pill badge-pink absolute top-2 left-2 z-10 shadow-lg shadow-pink-500/20">
            {discount}% OFF
          </span>
        )}

        {/* Delivery time badge — top-right */}
        <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm border border-white/50">
          <span className="text-[9px] font-bold text-[#150726] flex items-center gap-0.5">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#7CB518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            60 Mins
          </span>
        </div>

        {/* ADD button / Stepper — bottom-right overlapping image */}
        <div className="absolute bottom-2 right-2 z-10">
          {qty === 0 ? (
            <button
              ref={btnRef}
              onClick={handleAdd}
              className={`btn-add transition-all duration-200 ${justAdded ? "scale-95" : "hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"}`}
            >
              ADD
            </button>
          ) : (
            <div className={`stepper ${flashing ? "bolt-flash" : ""} shadow-lg shadow-green-500/25`}>
              <button onClick={handleDecrement}>−</button>
              <span className="tabular-nums">{qty}</span>
              <button onClick={handleIncrement}>+</button>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#150726]/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Info zone */}
      <div className="flex flex-col gap-1 p-3">
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] font-normal text-[#9B8CB5] truncate">
            {product.brand}
          </p>
        )}

        {/* Product name — 2-line clamp */}
        <h3 className="text-[13px] font-semibold text-[#150726] leading-[1.3] line-clamp-2 min-h-[34px] group-hover/card:text-[#2D1B69] transition-colors">
          {product.name}
        </h3>

        {/* Pack size */}
        <p className="text-[11px] text-[#9B8CB5]">{product.unit}</p>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-1">
          <span className="price-main">₹{product.price}</span>
          {discount > 0 && (
            <>
              <span className="price-mrp">₹{product.mrp}</span>
              <span className="price-discount">{discount}% off</span>
            </>
          )}
        </div>

        {/* Genuine tag */}
        {product.seller?.isVerified && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#00BCD4] font-medium mt-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Genuine
          </span>
        )}

        {/* Free delivery tag */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#7CB518] bg-[#7CB518]/8 px-1.5 py-0.5 rounded-full">
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            FREE Delivery
          </span>
        </div>
      </div>
    </Link>
  );
}

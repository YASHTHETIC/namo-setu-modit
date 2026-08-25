"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

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

  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const wishlisted = isWishlisted(product.id);

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isBulk = product.bulkMinQty && product.bulkMinQty > 1;
  const isBestseller = product.rating >= 4.5 && product.reviewCount > 50;
  const isFastDelivery = product.deliveryDays <= 1;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`product-card-mobile flex flex-col ${compact ? "w-[140px]" : "w-full"} group/card`}
    >
      {/* Image zone */}
      <div className="relative bg-[#F0ECF9] aspect-square overflow-hidden">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
            loading="lazy"
          />
        )}

        {/* Badges — top area */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="badge-pill badge-pink shadow-lg shadow-pink-500/20">
              {discount}% OFF
            </span>
          )}
          {isBestseller && !compact && (
            <span className="badge-bestseller">BESTSELLER</span>
          )}
          {isBulk && !compact && (
            <span className="badge-bulk">BULK PRICE</span>
          )}
        </div>

        {/* Wishlist button — top-right */}
        <button
          onClick={handleWishlist}
          className={`wishlist-btn ${wishlisted ? "active" : ""}`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-white" : ""}`} />
        </button>

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

        {/* Fast delivery badge — bottom-left */}
        {isFastDelivery && !compact && (
          <div className="absolute bottom-2 left-2 z-10 bg-white/95 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm border border-[#E8E0F7]">
            <span className="text-[9px] font-bold text-[#00BCD4] flex items-center gap-0.5">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              60 Mins
            </span>
          </div>
        )}
      </div>

      {/* Info zone */}
      <div className="flex flex-col gap-1 p-3">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] font-semibold text-[#7CB518] uppercase tracking-wide truncate">
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
          <span className="price-hero">₹{product.price.toLocaleString()}</span>
          {discount > 0 && (
            <>
              <span className="price-strike">₹{product.mrp.toLocaleString()}</span>
              <span className="price-save">{discount}% off</span>
            </>
          )}
        </div>

        {/* Bulk pricing indicator */}
        {isBulk && !compact && product.bulkPrice && (
          <p className="text-[10px] font-semibold text-[#FF9800]">
            Bulk: ₹{product.bulkPrice.toLocaleString()}/unit (min {product.bulkMinQty} {product.unitCode})
          </p>
        )}

        {/* Genuine + Free delivery row */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {product.seller?.isVerified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#00BCD4] font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Genuine
            </span>
          )}
          {product.freeDelivery && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#7CB518] bg-[#7CB518]/8 px-1.5 py-0.5 rounded-full">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              FREE Delivery
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

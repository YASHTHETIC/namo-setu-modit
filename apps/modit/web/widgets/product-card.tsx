"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/product-data";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const [qty, setQty] = useState(0);
  const [flashing, setFlashing] = useState(false);

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty(1);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 400);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => q + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => Math.max(0, q - 1));
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={`product-card flex flex-col ${compact ? "w-[140px]" : "w-full"}`}
    >
      {/* Image zone */}
      <div className="relative bg-[#F0ECF9] aspect-square overflow-hidden">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Discount badge — pink pill, top-left */}
        {discount > 0 && (
          <span className="badge-pill badge-pink absolute top-2 left-2">
            {discount}% OFF
          </span>
        )}

        {/* ADD button / Stepper — bottom-right overlapping image */}
        <div className="absolute bottom-2 right-2">
          {qty === 0 ? (
            <button onClick={handleAdd} className="btn-add">
              ADD
            </button>
          ) : (
            <div className={`stepper ${flashing ? "bolt-flash" : ""}`}>
              <button onClick={handleDecrement}>−</button>
              <span>{qty}</span>
              <button onClick={handleIncrement}>+</button>
            </div>
          )}
        </div>
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
        <h3 className="text-[13px] font-semibold text-[#150726] leading-[1.3] line-clamp-2 min-h-[34px]">
          {product.name}
        </h3>

        {/* Pack size */}
        <p className="text-[11px] text-[#9B8CB5]">{product.unit}</p>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-1">
          <span className="price-main">₹{product.price}</span>
          {discount > 0 && (
            <span className="price-mrp">₹{product.mrp}</span>
          )}
        </div>

        {/* Genuine tag — cyan, sparingly for branded items */}
        {product.seller?.isVerified && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#00BCD4] font-medium mt-0.5">
            Genuine ✓
          </span>
        )}
      </div>
    </Link>
  );
}

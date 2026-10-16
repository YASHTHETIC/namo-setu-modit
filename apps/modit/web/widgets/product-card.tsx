"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistToggle } from "@/lib/use-wishlist-toggle";
import { resolveProduct } from "@/lib/pricing";
import { useAdminStore } from "@/lib/admin-store";
import { useSupplierStore } from "@/lib/supplier-store";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { productLink } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

/**
 * Blinkit-exact card anatomy (MODIT theme):
 * image + single %OFF ribbon, time pill, 2-line name, unit,
 * bottom row of price (+strike below) and ADD/stepper.
 * No repeated discount pills, no overlay buttons — one path each.
 * Variant/shade choice lives behind the "N options" link (modal).
 */
export function ProductCard({ product, compact = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const stepDown = useCartStore((s) => s.stepDown);
  const items = useCartStore((s) => s.items);
  const adminOverrides = useAdminStore((s) => s.overrides);
  const adminSales = useAdminStore((s) => s.sales);
  const adminSuppliers = useSupplierStore((s) => s.suppliers);
  const live = resolveProduct(product);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null
  );
  const [optionsOpen, setOptionsOpen] = useState(false);
  const tryAdd = useAddToCart();
  const { wishlisted, toggle: toggleWishlist } = useWishlistToggle(product);
  if (live.hidden) return null;
  const existing = items.find(
    (i) => i.product.id === product.id && (i.variantId ?? null) === selectedVariantId
  );
  const qty = existing?.quantity ?? 0;
  const optLabel = optionsLabel(live);

  const selectedVariant = selectedVariantId
    ? live.variants?.find((v) => v.id === selectedVariantId) ?? null
    : null;
  const activePrice = selectedVariant?.price ?? live.price;
  const activeMrp = selectedVariant?.mrp ?? live.mrp;

  const discount = activeMrp > activePrice
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    tryAdd(live, 1, selectedVariantId ?? undefined);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(live, 1, selectedVariantId ?? undefined);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stepDown(product.id, selectedVariantId ?? undefined);
  };

  const openOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOptionsOpen(true);
  };

  return (
    <Link
      href={productLink(product)}
      className={`bg-white border border-[#E7DEF5] rounded-xl overflow-hidden flex flex-col h-full shadow-[0_1px_2px_rgba(26,10,51,0.05)] hover:shadow-[0_10px_28px_-12px_rgba(45,27,105,0.22)] hover:-translate-y-0.5 transition-all duration-300 ${compact ? "w-[140px]" : "w-full"} group group/card`}
    >
      {/* Image zone — single %OFF ribbon, nothing else */}
      <div className="relative bg-[#F7F4FC] aspect-square overflow-hidden">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 300px"
            loading="lazy"
            draggable={false}
            className="object-contain animate-fade-in transition-transform duration-500 group-hover/card:scale-105"
          />
        )}
        {discount > 0 && (
          <span className="absolute top-0 left-0 z-10 bg-[#2D1B69] text-white rounded-br-lg px-2 py-1 text-tiny font-black">
            {discount}% OFF
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm hover:scale-110 active:scale-95 transition-transform"
        >
          <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${wishlisted ? "fill-[#E91E63] text-[#E91E63]" : "fill-none text-[#9B8CB5]"}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      {/* Info zone */}
      <div className="flex flex-col flex-1 gap-0.5 p-2.5">
        <p className="flex items-center gap-1 text-tiny font-semibold text-[#9B8CB5]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          60 MINS
        </p>
        <h3 className="text-body-sm font-medium text-[#150726] leading-[1.3] line-clamp-2 min-h-[34px]">
          {product.name}
        </h3>
        <p className="text-micro text-[#9B8CB5] truncate">
          {product.unit}
          {live.stockLevel > 0 && live.stockLevel <= 10 && (
            <span className="font-bold text-[#E91E63]"> · Only {live.stockLevel} left</span>
          )}
        </p>

        {/* Bottom row — price block left, ADD/stepper right */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            <p className="text-body-md font-extrabold tracking-tight text-[#150726] tabular-nums leading-tight">
              ₹{activePrice.toLocaleString()}
            </p>
            {activeMrp > activePrice && (
              <p className="text-tiny text-[#9B8CB5] line-through tabular-nums">
                ₹{activeMrp.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className="btn-add"
              >
                ADD
              </button>
            ) : (
              <div className="stepper shadow-md shadow-green-500/25">
                <button onClick={handleDecrement} aria-label="Decrease quantity">−</button>
                <span className="tabular-nums">{qty}</span>
                <button onClick={handleIncrement} aria-label="Increase quantity">+</button>
              </div>
            )}
            {optLabel && !compact && (
              <button
                onClick={openOptions}
                className="text-tiny font-semibold text-[#6B5B83] hover:text-[#2D1B69] transition-colors"
              >
                {optLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <VariantOptionsModal
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        product={live}
      />
    </Link>
  );
}

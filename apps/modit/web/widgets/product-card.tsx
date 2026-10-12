"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";
import { resolveProduct } from "@/lib/pricing";
import { useAdminStore } from "@/lib/admin-store";
import { useSupplierStore } from "@/lib/supplier-store";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { useAddToCart } from "@/lib/use-add-to-cart";

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const live = resolveProduct(product);
  if (live.hidden) return null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null
  );
  const existing = items.find(
    (i) => i.product.id === product.id && (i.variantId ?? null) === selectedVariantId
  );
  const qty = existing?.quantity ?? 0;
  const [optionsOpen, setOptionsOpen] = useState(false);
  const tryAdd = useAddToCart();
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
      href={`/products/${product.id}`}
      className={`bg-white border border-[#EDE7F6] rounded-xl overflow-hidden flex flex-col h-full ${compact ? "w-[140px]" : "w-full"} group group/card`}
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
        <p className="text-micro text-[#9B8CB5]">{product.unit}</p>

        {/* Bottom row — price block left, ADD/stepper right */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            <p className="text-body-md font-extrabold text-[#150726] tabular-nums leading-tight">
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

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Heart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { usePincode } from "@/lib/pincode-context";
import { useRequireLogin } from "@/lib/use-auth";
import type { DisplayProduct } from "@/lib/pricing";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";

/** Parse "50kg" / "5 kg" / "20 L" into { qty, label } for per-unit pricing. */
function parseUnit(unit: string, fallback: string): { qty: number; label: string } | null {
  const qty = parseFloat(unit);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const label = unit.replace(/[\d.\s]/g, "") || fallback;
  return { qty, label };
}

function perUnitText(price: number, unit: string, unitCode: string): string | null {
  const parsed = parseUnit(unit, unitCode);
  if (!parsed) return null;
  const val = price / parsed.qty;
  const shown = val >= 100 ? Math.round(val).toString() : (Math.round(val * 10) / 10).toString();
  return `₹${shown}/${parsed.label}`;
}

/**
 * Blinkit-style compact card for the mobile 2-column grid:
 * image, overlapping unit pill + ADD/stepper, options link,
 * per-unit rate, price + MRP, discount line, name, rating,
 * delivery time + stock left.
 */
export function MobileProductCard({ product }: { product: DisplayProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const stepDown = useCartStore((s) => s.stepDown);
  const items = useCartStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const optLabel = optionsLabel(product);
  const requireLogin = useRequireLogin();
  const { pincode: myPin, serviceable: myAreaOk } = usePincode();
  const blocked = Boolean(myPin) && !myAreaOk;

  const lines = items.filter((i) => i.product.id === product.id);
  const qty = lines.reduce((s, i) => s + i.quantity, 0);
  const stepLine = lines.find((i) => !i.variantId) ?? lines[0];

  const discountAmt = product.mrp > product.price ? Math.round(product.mrp - product.price) : 0;
  const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const unitRate = perUnitText(product.price, product.unit, product.unitCode);
  const stars = Math.max(0, Math.min(5, Math.round(product.rating)));

  return (
    <div className="bg-white rounded-xl border border-[#EDE7F6] overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative bg-[#F7F4FC]">
        <Link href={`/products/${product.id}`} className="relative block aspect-square">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="50vw"
              loading="lazy"
              draggable={false}
              className="object-contain animate-fade-in"
            />
          ) : null}
        </Link>
        {discountPct > 0 && (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-[#E91E63] px-1.5 py-0.5 text-[9px] font-black text-white">
            {discountPct}% OFF
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm"
          aria-label="Wishlist"
        >
          <Heart className={`h-3 w-3 ${wishlisted ? "fill-[#E91E63] text-[#E91E63]" : "text-[#9B8CB5]"}`} />
        </button>

        {/* Overlapping unit + ADD row */}
        <div className="absolute -bottom-4 left-2 right-2 flex items-end justify-between gap-1">
          <span className="rounded-md bg-white px-1.5 py-1 text-[10px] font-bold text-[#150726] shadow-md border border-[#EDE7F6] whitespace-nowrap">
            {product.unit}
          </span>
          {qty === 0 ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!blocked && requireLogin()) addItem(product); }}
              disabled={blocked}
              className="rounded-lg bg-white px-5 py-1.5 text-[12px] font-black text-[#2D7B2D] shadow-md border border-[#2D7B2D]/40 active:scale-95 transition-transform disabled:opacity-40"
            >
              {blocked ? "N/A" : "ADD"}
            </button>
          ) : (
            <div className="flex items-center rounded-lg bg-[#2D7B2D] text-white shadow-md overflow-hidden">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); stepDown(product.id, stepLine?.variantId); }}
                className="px-2.5 py-1.5 text-[14px] font-black leading-none"
                aria-label="Decrease"
              >
                −
              </button>
              <span className="px-1 text-[12px] font-black tabular-nums min-w-[18px] text-center">{qty}</span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!blocked && requireLogin()) addItem(product); }}
                className="px-2.5 py-1.5 text-[14px] font-black leading-none"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-2 pt-5 pb-2 flex flex-col flex-1">
        {optLabel ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOptionsOpen(true); }}
            className="self-end -mt-1 text-[10px] font-bold text-[#2D7B2D]"
          >
            {optLabel.replace("Options", "options").replace("Colours", "colours")} ▾
          </button>
        ) : <span className="h-[14px]" />}
        {unitRate && <p className="text-[10px] text-[#6B5B83]">{unitRate}</p>}
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-[15px] font-black text-[#150726]">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && (
            <span className="text-[10px] text-[#9B8CB5] line-through">₹{product.mrp.toLocaleString()}</span>
          )}
        </div>
        {discountAmt > 0 && (
          <p className="text-[10px] font-bold text-[#2D7B2D]">
            ₹{discountAmt} OFF{discountPct > 0 ? ` (${discountPct}% OFF on MRP)` : ""}
          </p>
        )}
        <Link href={`/products/${product.id}`}>
          <p className="text-[11px] font-semibold text-[#150726] leading-tight line-clamp-2 mt-0.5 min-h-[28px]">{product.name}</p>
        </Link>
        <div className="flex items-center gap-0.5 mt-1">
          <span className="flex items-center gap-[1px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-2 w-2 ${i < stars ? "fill-[#E8A800] text-[#E8A800]" : "fill-[#E0D8EE] text-[#E0D8EE]"}`} />
            ))}
          </span>
          <span className="text-[9px] text-[#9B8CB5] ml-0.5">{product.reviewCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-[#6B5B83]">
            <Clock className="h-2 w-2" /> {product.deliveryDays <= 1 ? "Tomorrow" : `${product.deliveryDays} days`}
          </span>
          {product.stockLevel <= 10 && (
            <span className="text-[9px] font-black text-[#E91E63] border border-[#E91E63]/40 rounded px-1">
              {product.stockLevel} left
            </span>
          )}
          {blocked && (
            <span className="text-[9px] font-black text-[#E91E63]">Unavailable in your area</span>
          )}
        </div>
        {product.onSale && product.saleName && (
          <span className="mt-1 self-start rounded bg-[#7CB518] px-1.5 py-0.5 text-[8px] font-black text-white uppercase">
            {product.saleName}
          </span>
        )}
      </div>

      <VariantOptionsModal
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        product={product}
      />
    </div>
  );
}

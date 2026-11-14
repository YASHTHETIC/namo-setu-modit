"use client";

import { useState } from "react";
import { ImageGuard } from "@/components/product-thumb";
import Link from "next/link";
import { Star, Clock, Heart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistToggle } from "@/lib/use-wishlist-toggle";
import { usePincode } from "@/lib/pincode-context";
import type { DisplayProduct } from "@/lib/pricing";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { productLink } from "@/lib/utils";

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
  const stepDown = useCartStore((s) => s.stepDown);
  const items = useCartStore((s) => s.items);
  const { wishlisted, toggle: toggleWishlist } = useWishlistToggle(product);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const optLabel = optionsLabel(product);
  const tryAdd = useAddToCart();
  const { pincode: myPin, serviceable: myAreaOk } = usePincode();
  const blocked = Boolean(myPin) && !myAreaOk;

  const lines = items.filter((i) => i.product.id === product.id);
  const qty = lines.reduce((s, i) => s + i.quantity, 0);
  const stepLine = lines.find((i) => !i.variantId) ?? lines[0];

  const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const unitRate = perUnitText(product.price, product.unit, product.unitCode);
  const stars = Math.max(0, Math.min(5, Math.round(product.rating)));

  return (
    <>
      <div className="group card-lift bg-white rounded-xl border border-[#EDE7F6] overflow-hidden flex flex-col h-full shadow-[0_1px_3px_rgba(26,10,51,0.06)] hover:shadow-md transition-all">
      {/* Image zone — clean & completely unobstructed */}
      <div className="relative bg-[#F7F4FC] p-2 aspect-square">
        <Link href={productLink(product)} className="relative block h-full w-full">
          <ImageGuard
            src={product.images?.[0]}
            alt={product.name}
            fill
            sizes="50vw"
            draggable={false}
            className="object-contain p-1 animate-fade-in card3d-img"
          />
        </Link>
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md bg-[#047857] px-1.5 py-0.5 text-tiny font-black tracking-tight text-white shadow-xs">
            {discountPct}% OFF
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(); }}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm"
          aria-label="Wishlist"
        >
          <Heart className={`h-3 w-3 ${wishlisted ? "fill-[#E91E63] text-[#E91E63]" : "text-[#9B8CB5]"}`} />
        </button>
      </div>

      {/* Info zone — Blinkit layout: ETA, Name, Unit, Bottom Price+ADD Row */}
      <div className="p-2 sm:p-2.5 flex flex-col flex-1 gap-1">
        <div className="flex items-center justify-between gap-1 text-tiny">
          <span className="flex items-center gap-0.5 font-bold text-[#2D1B69] bg-[#F0ECF9] px-1.5 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5 text-[#7CB518]" /> 60 MINS
          </span>
          <div className="flex items-center gap-1.5">
            {product.shades && product.shades.length > 0 && (
              <div className="flex items-center -space-x-1" title={`${product.shades.length} shades available`}>
                {product.shades.slice(0, 3).map((s) => (
                  <span
                    key={s.name}
                    className="h-2.5 w-2.5 rounded-full border border-white shadow-xs inline-block"
                    style={{ backgroundColor: s.code }}
                  />
                ))}
              </div>
            )}
            {optLabel && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOptionsOpen(true); }}
                className="text-tiny font-bold text-[#047857] hover:underline"
              >
                {optLabel.replace("Options", "options").replace("Colours", "colours")} ▾
              </button>
            )}
          </div>
        </div>

        <Link href={productLink(product)}>
          <h3 className="text-body-sm font-semibold text-[#150726] leading-tight line-clamp-2 min-h-[32px] hover:text-[#2D1B69] transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="text-micro text-[#6B5B83] truncate">
          {product.unit} {unitRate && <span className="text-[#9B8CB5]">({unitRate})</span>}
          {product.stockLevel <= 10 && product.stockLevel > 0 && (
            <span className="font-bold text-[#E91E63]"> · {product.stockLevel} left</span>
          )}
        </p>

        {/* Bottom row: Price on left, ADD button / Stepper on right */}
        <div className="mt-auto flex items-end justify-between gap-1.5 pt-1.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-body-md font-extrabold text-[#150726] tabular-nums leading-tight">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.mrp > product.price && (
                <span className="text-micro text-[#9B8CB5] line-through tabular-nums">
                  ₹{product.mrp.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {qty === 0 ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (blocked) return;
                  if (optLabel) {
                    setOptionsOpen(true);
                  } else {
                    const added = tryAdd(product);
                    if (!added) setOptionsOpen(true);
                  }
                }}
                disabled={blocked}
                className="btn-shine rounded-lg bg-white px-3.5 py-1 text-caption font-black text-[#2D7B2D] shadow-xs border border-[#2D7B2D]/50 hover:bg-[#2D7B2D] hover:text-white active:scale-95 transition-all disabled:opacity-40"
              >
                {blocked ? "N/A" : optLabel ? "OPTIONS ▾" : "ADD"}
              </button>
            ) : (
              <div className="flex items-center rounded-lg bg-[#2D7B2D] text-white shadow-xs overflow-hidden">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    stepDown(product.id, stepLine?.variantId, stepLine?.shade);
                  }}
                  className="px-2 py-1 text-caption font-black leading-none hover:bg-black/10 active:scale-95"
                  aria-label="Decrease"
                >
                  −
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (optLabel) setOptionsOpen(true);
                  }}
                  className="px-1.5 text-caption font-black tabular-nums min-w-[16px] text-center hover:underline"
                  title={optLabel ? "Choose Options / Colours" : undefined}
                >
                  {qty}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (blocked) return;
                    if (optLabel) {
                      setOptionsOpen(true);
                    } else {
                      const added = tryAdd(product, 1, stepLine?.variantId, stepLine?.shade);
                      if (!added) setOptionsOpen(true);
                    }
                  }}
                  className="px-2 py-1 text-caption font-black leading-none hover:bg-black/10 active:scale-95"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <VariantOptionsModal
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      product={product}
    />
  </>
  );
}

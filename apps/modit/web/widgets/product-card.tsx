"use client";

import { useState } from "react";
import { ImageGuard } from "@/components/product-thumb";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistToggle } from "@/lib/use-wishlist-toggle";
import { resolveProduct } from "@/lib/pricing";
import { VariantOptionsModal, optionsLabel } from "@/components/variant-options-modal";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { formatINR, productLink } from "@/lib/utils";

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
  const live = resolveProduct(product);
  const defaultVar = live.defaultVariant ?? live.variants?.[0] ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVar?.id ?? null
  );
  const [optionsOpen, setOptionsOpen] = useState(false);
  const tryAdd = useAddToCart();
  const { wishlisted, toggle: toggleWishlist } = useWishlistToggle(product);
  if (live.hidden) return null;
  const effectiveVariantId = selectedVariantId ?? defaultVar?.id ?? null;
  const existing = items.find(
    (i) => i.product.id === product.id && (i.variantId ?? null) === effectiveVariantId
  );
  const qty = existing?.quantity ?? 0;
  const optLabel = optionsLabel(live);

  const selectedVariant = effectiveVariantId
    ? live.variants?.find((v) => v.id === effectiveVariantId) ?? defaultVar
    : defaultVar;
  const activePrice = selectedVariant?.price ?? live.price;
  const activeMrp = selectedVariant?.mrp ?? live.mrp;

  const discount = activeMrp > activePrice
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const catAccent = (() => {
    const m: Record<string, string> = {
      cement: "#7CB518", painting: "#F8CB46", lighting: "#00BCD4", tiling: "#E91E63",
      electrical: "#F8CB46", "hardware-tools": "#607D8B", conduits: "#FF9800",
    };
    return m[(product.categorySlug ?? "cement").toLowerCase()] ?? "#7CB518";
  })();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (optLabel) {
      setOptionsOpen(true);
      return;
    }
    const ok = tryAdd(live, 1, effectiveVariantId ?? undefined);
    if (!ok) setOptionsOpen(true);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (optLabel) {
      setOptionsOpen(true);
      return;
    }
    const ok = tryAdd(live, 1, effectiveVariantId ?? undefined);
    if (!ok) setOptionsOpen(true);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stepDown(product.id, effectiveVariantId ?? undefined);
  };

  const openOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOptionsOpen(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--glare-x", `${x}%`);
    e.currentTarget.style.setProperty("--glare-y", `${y}%`);
  };

  return (
    <>
      <Link
        href={productLink(product)}
        onPointerMove={handlePointerMove}
        className="card-3d-inner transform-3d bg-white border border-[#E7DEF5] rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_2px_8px_rgba(26,10,51,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(45,27,105,0.22),0_0_25px_-4px_rgba(124,181,24,0.25)] hover:border-[#7CB518]/60 hover:-translate-y-2 transition-all duration-300 w-full group group/card relative"
      >
      {/* Dynamic Ray-Traced Specular Glare */}
      <div aria-hidden="true" className="specular-glare-overlay" />

      {/* Image zone — animated studio showcase sized to card */}
      <div
        className="product-image-wrap aspect-square w-full transform-3d"
        style={{ "--cat-accent": catAccent } as React.CSSProperties}
      >
        <div className="product-image-ring" />
        <div className="product-image-enhanced p-2">
          <div className="product-image-glow" />
          <div className="product-image-shine" />
          <div className="relative h-full w-full layer-3d-pop">
            {product.images?.[0] ? (
              <ImageGuard
                src={product.images?.[0]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 220px, 240px"
                quality={85}
                draggable={false}
                className="object-contain p-2 animate-fade-in card3d-img"
              />
            ) : (
              <div className="product-image-placeholder h-full w-full rounded-xl">
                <Package className="h-12 w-12" style={{ color: catAccent, opacity: 0.5 }} />
              </div>
            )}
          </div>
        </div>
        <div className="product-image-reflection" />
        {discount > 0 && (
          <span className="layer-3d-badge absolute top-2 left-2 z-20 inline-flex items-center rounded-lg bg-[#047857] px-2 py-0.5 text-tiny font-black tracking-tight text-white shadow-sm border border-emerald-400/40 shadow-emerald-700/20">
            {discount}% OFF
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm border border-black/5 hover:scale-115 active:scale-90 transition-all cursor-pointer backdrop-blur-xs"
        >
          <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${wishlisted ? "fill-[#E91E63] text-[#E91E63]" : "fill-none text-[#9B8CB5]"}`} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      {/* Info zone */}
      <div className="flex flex-col flex-1 gap-1 p-2 sm:p-3">
        <div className="flex items-center justify-between gap-1 text-tiny">
          <p className="flex items-center gap-1.5 font-bold text-[#5C4A7A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7CB518] shadow-[0_0_6px_#7CB518] animate-pulse" />
            <span className="tracking-wide text-tiny uppercase font-black text-[#5A8010]">60 MINS</span>
          </p>
          {live.shades && live.shades.length > 0 && (
            <div className="flex items-center -space-x-1" title={`${live.shades.length} shades available`}>
              {live.shades.slice(0, 3).map((s) => (
                <span
                  key={s.name}
                  className="h-2.5 w-2.5 rounded-full border border-white shadow-xs inline-block"
                  style={{ backgroundColor: s.code }}
                />
              ))}
            </div>
          )}
        </div>
        <h3 className="text-body-sm font-semibold text-[#150726] leading-[1.3] line-clamp-2 min-h-[34px] group-hover/card:text-[#2D1B69] transition-colors">
          {product.name}
        </h3>
        {/* Pack size / Unit selector pill — Blinkit style */}
        <div className="flex items-center gap-1.5 my-0.5">
          {optLabel ? (
            <button
              type="button"
              onClick={openOptions}
              className="inline-flex items-center gap-1 text-micro font-bold text-[#2D1B69] hover:text-[#7CB518] bg-[#F7F4FC] hover:bg-[#F0ECF9] px-2 py-0.5 rounded-md border border-[#EDE7F6] transition-colors cursor-pointer"
            >
              <span>{selectedVariant?.label || product.unit}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#2D1B69]">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          ) : (
            <span className="text-micro text-[#9B8CB5] truncate">{product.unit}</span>
          )}
          {live.stockLevel > 0 && live.stockLevel <= 10 && (
            <span className="text-micro font-bold text-[#E91E63]"> · Only {live.stockLevel} left</span>
          )}
        </div>

        {/* Bottom row — full non-truncated price left, ADD/stepper right */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-1.5 gap-y-1 pt-1.5 min-w-0">
          <div className="shrink-0 flex flex-col justify-end">
            <span className="text-body-md font-black tracking-tight text-[#150726] tabular-nums leading-tight whitespace-nowrap">
              {formatINR(activePrice)}
            </span>
            {activeMrp > activePrice && (
              <span className="text-micro text-[#9B8CB5] line-through tabular-nums -mt-0.5 whitespace-nowrap">
                {formatINR(activeMrp)}
              </span>
            )}
          </div>
          <div className="ml-auto flex-shrink-0">
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className={`btn-add btn-add-enhanced cursor-pointer whitespace-nowrap ${compact ? "!px-2.5 !py-1 text-caption font-bold" : ""}`}
                aria-label={`Add ${product.name} to cart`}
              >
                ADD
              </button>
            ) : (
              <div className={`stepper shadow-md shadow-green-500/35 border border-white/20 ${compact ? "stepper-compact" : ""}`}>
                <button onClick={handleDecrement} aria-label="Decrease quantity">−</button>
                <span className="tabular-nums font-black">{qty}</span>
                <button onClick={handleIncrement} aria-label="Increase quantity">+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>

    <VariantOptionsModal
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      product={live}
    />
  </>
  );
}

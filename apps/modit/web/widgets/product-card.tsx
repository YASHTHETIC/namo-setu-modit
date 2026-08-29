"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Heart, GitCompareArrows } from "lucide-react";
import type { Product } from "@/lib/product-data";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useComparisonStore } from "@/lib/comparison-store";
import { PincodeStockIndicator } from "@/components/pincode-stock-indicator";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null
  );
  const existing = items.find(
    (i) => i.product.id === product.id && (i.variantId ?? null) === selectedVariantId
  );
  const qty = existing?.quantity ?? 0;
  const [flashing, setFlashing] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selectedVariant = selectedVariantId
    ? product.variants?.find((v) => v.id === selectedVariantId) ?? null
    : null;
  const activePrice = selectedVariant?.price ?? product.price;
  const activeMrp = selectedVariant?.mrp ?? product.mrp;
  const activeStock = selectedVariant?.stockLevel ?? product.stockLevel;

  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const wishlisted = isWishlisted(product.id);

  const discount = activeMrp > activePrice
    ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, selectedVariantId ?? undefined);
    setFlashing(true);
    setJustAdded(true);
    setTimeout(() => setFlashing(false), 400);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, selectedVariantId ?? undefined);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const removeItem = useCartStore.getState().removeItem;
    removeItem(product.id, selectedVariantId ?? undefined);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const { addToCompare, removeFromCompare, isInCompare, canAdd } = useComparisonStore();
  const inCompare = isInCompare(product.id);
  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const isBulk = product.bulkMinQty && product.bulkMinQty > 1;
  const isBestseller = product.rating >= 4.5 && product.reviewCount > 50;
  const hasVariants = product.variants && product.variants.length > 0;
  const hasFreeDeliveryThreshold = product.freeDeliveryThreshold && !product.freeDelivery;

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

        {/* Pincode stock indicator */}
        {product.pincodeStock && !compact && (
          <div className="absolute bottom-10 left-2 z-10">
            <PincodeStockIndicator pincodeStock={product.pincodeStock} />
          </div>
        )}

        {/* Wishlist button — top-right */}
        <button
          onClick={handleWishlist}
          className={`wishlist-btn ${wishlisted ? "active" : ""}`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-white" : ""}`} />
        </button>

        {/* Compare button — below wishlist */}
        {!compact && (
          <button
            onClick={handleCompare}
            className={`absolute top-10 right-2 z-10 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
              inCompare
                ? "bg-[#2D1B69] text-white"
                : "bg-white/90 text-[#9B8CB5] hover:bg-[#2D1B69] hover:text-white border border-[#DDD6EE]"
            }`}
            aria-label={inCompare ? "Remove from compare" : "Add to compare"}
          >
            <GitCompareArrows className="h-3 w-3" />
          </button>
        )}

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

        {/* Delivery badge — bottom-left */}
        {!compact && (
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

        {/* Size options — inline for variant products */}
        {hasVariants && !compact && (
          <div className="flex flex-wrap gap-1 mt-1" onClick={(e) => e.preventDefault()}>
            {product.variants!.map((v) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedVariantId(v.id);
                }}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border-2 transition-all ${
                  selectedVariantId === v.id
                    ? "border-[#2D1B69] bg-[#2D1B69] text-white"
                    : "border-[#DDD6EE] text-[#9B8CB5] hover:border-[#C9B8E8]"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Pack size / Variants count */}
        <p className="text-[11px] text-[#9B8CB5]">
          {hasVariants
            ? `${product.variants!.length} options · ${product.unit}`
            : product.unit}
        </p>

        {/* Shade color dots */}
        {product.hasShades && product.shades && product.shades.length > 0 && !compact && (
          <div className="flex items-center gap-1 mt-1" onClick={(e) => e.preventDefault()}>
            {product.shades.slice(0, 7).map((shade) => (
              <button
                key={shade.code}
                title={shade.name}
                className="h-4 w-4 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform"
                style={{ backgroundColor: shade.code }}
              />
            ))}
            {product.shades.length > 7 && (
              <span className="text-[9px] font-bold text-[#9B8CB5]">+{product.shades.length - 7}</span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-1">
          <span className="price-hero">₹{activePrice.toLocaleString()}</span>
          {discount > 0 && (
            <>
              <span className="price-strike">₹{activeMrp.toLocaleString()}</span>
              <span className="price-save">{discount}% off</span>
            </>
          )}
        </div>

        {/* Bulk pricing indicator */}
        {isBulk && !compact && product.bulkPrice && (
          <p className="text-[10px] font-semibold text-[#FF9800]">
            Bulk: ₹{product.bulkPrice.toLocaleString()}/unit (min {product.bulkMinQty})
          </p>
        )}

        {/* Genuine + Free delivery + Cashback row */}
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
          {hasFreeDeliveryThreshold && !compact && (
            <span className="text-[8px] text-[#9B8CB5]">
              Free above ₹{product.freeDeliveryThreshold!.toLocaleString()}
            </span>
          )}
          {product.cashbackPercent && product.cashbackPercent > 0 && !compact && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#E91E63] bg-[#E91E63]/8 px-1.5 py-0.5 rounded-full">
              {product.cashbackPercent}% Cashback
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

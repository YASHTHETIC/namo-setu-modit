"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Check, ShoppingCart, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useModalBehavior } from "@/lib/use-modal-behavior";
import type { DisplayProduct } from "@/lib/pricing";

interface VariantOptionsModalProps {
  open: boolean;
  onClose: () => void;
  product: DisplayProduct;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

/**
 * Canva-style options picker: circular colour shades with active ring,
 * custom tint code, plus pack-size rows with per-row Add buttons.
 * Guarantees that paint products cannot be added without a chosen colour shade.
 */
export function VariantOptionsModal({ open, onClose, product }: VariantOptionsModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [selectedShade, setSelectedShade] = useState<string | null>("Soft Lilac");
  const [customColorCode, setCustomColorCode] = useState("");
  const [showAllShades, setShowAllShades] = useState(false);
  const [shadeRequiredError, setShadeRequiredError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalBehavior(open, onClose);

  const variants = useMemo(() => product.variants ?? [], [product]);
  const shades = useMemo(() => product.shades ?? [], [product]);

  // Set default shade if available and none selected yet
  const effectiveShade = selectedShade || (customColorCode ? `Code ${customColorCode}` : null);

  if (!open || !mounted) return null;

  const handleAddVariant = (variantId: string) => {
    if (shades.length > 0 && !effectiveShade) {
      setShadeRequiredError(true);
      return;
    }
    setShadeRequiredError(false);
    addItem(product, 1, variantId, effectiveShade ?? undefined);
    setAddedKey(`v:${variantId}`);
    setTimeout(() => {
      setAddedKey(null);
      onClose();
    }, 400);
  };

  const handleAddShade = () => {
    if (!effectiveShade) {
      setShadeRequiredError(true);
      return;
    }
    setShadeRequiredError(false);
    const defaultVariant = variants[0]?.id;
    addItem(product, 1, defaultVariant, effectiveShade);
    setAddedKey("shade");
    setTimeout(() => {
      setAddedKey(null);
      onClose();
    }, 400);
  };

  const handleSelectShade = (name: string) => {
    setSelectedShade(name);
    setCustomColorCode("");
    setShadeRequiredError(false);
  };

  const heroShades = shades.slice(0, 6);
  const remainingShades = shades.slice(6);

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[88dvh] overflow-hidden flex flex-col animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#F0ECF9] px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10 flex-shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-body-md font-bold text-[#150726] leading-snug truncate">{product.name}</h3>
            {shades.length > 0 && (
              <p className="text-micro font-bold text-[#2D1B69] mt-0.5">Choose your backdrop shade & pack size</p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close options"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0ECF9] hover:bg-[#E8E0F7] text-[#150726] active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-xs"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {shadeRequiredError && (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-center text-caption font-bold text-amber-800 animate-pulse">
              ⚠️ Please select a paint shade before adding to cart!
            </div>
          )}

          {/* Canva-style Shade Picker: "Choose your backdrop shade" + Large Circles */}
          {shades.length > 0 && (
            <div className={`rounded-2xl border p-4 transition-colors ${shadeRequiredError ? "border-amber-400 bg-amber-50/20" : "border-[#EDE7F6] bg-[#F5F2FC]"}`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-caption font-extrabold text-[#150726] tracking-tight">
                  Choose your backdrop shade
                </span>
                <span className="text-caption font-black text-[#2D1B69] bg-[#F0ECF9] px-2.5 py-0.5 rounded-full">
                  {effectiveShade || "Select"}
                </span>
              </div>

              {/* Large Circular Swatches (Canva Style) */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {(showAllShades ? shades : heroShades).map((sh) => {
                  const isSelected = selectedShade === sh.name;
                  return (
                    <button
                      key={sh.name}
                      type="button"
                      onClick={() => handleSelectShade(sh.name)}
                      className={`relative flex items-center justify-center rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? "h-11 w-11 ring-3 ring-[#2D1B69] ring-offset-2 scale-105 shadow-md"
                          : "h-9 w-9 hover:scale-110 border-2 border-white shadow-xs opacity-90 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: sh.code }}
                      title={`${sh.name} (${sh.code})`}
                      aria-label={sh.name}
                    >
                      {isSelected && (
                        <Check className={`h-4 w-4 ${isLightColor(sh.code) ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Toggle to view all 20+ fan-deck shades */}
              {remainingShades.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllShades(!showAllShades)}
                  className="mt-3 inline-flex items-center gap-1 text-tiny font-bold text-[#2D1B69] hover:underline"
                >
                  {showAllShades ? (
                    <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                  ) : (
                    <>View All {shades.length} Fan-Deck Shades <ChevronDown className="h-3.5 w-3.5" /></>
                  )}
                </button>
              )}

              {/* Custom Tint Code Input */}
              <div className="mt-3 pt-2.5 border-t border-[#EDE7F6] flex items-center gap-2">
                <span className="text-micro font-bold text-[#6B5B83]">Or Tint Code:</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-micro font-bold text-[#9B8CB5]">#</span>
                  <input
                    type="text"
                    placeholder="E8D5B7"
                    value={customColorCode.replace("#", "")}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6);
                      setCustomColorCode(val ? `#${val}` : "");
                      if (val) {
                        setSelectedShade(null);
                        setShadeRequiredError(false);
                      }
                    }}
                    className="w-full h-8 rounded-lg border border-[#DDD6EE] bg-white pl-6 pr-2 text-micro font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#2D1B69]"
                  />
                </div>
                {customColorCode && customColorCode.length >= 4 && (
                  <span
                    className="h-8 w-8 rounded-lg border border-[#DDD6EE] flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: customColorCode }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Pack-size / variant rows */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-caption font-extrabold text-[#150726] px-1">
                {shades.length > 0 ? "Select Pack Size" : "Available Options"}
              </p>
              {variants.map((v) => {
                const key = `v:${v.id}`;
                const added = addedKey === key;
                const discount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                return (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border border-[#F0ECF9] p-3 hover:border-[#7CB518]/40 transition-colors bg-white">
                    {product.images[0] && (
                      <Image src={product.images[0]} alt={v.label} width={44} height={44} loading="lazy" className="h-11 w-11 rounded-lg object-contain bg-[#F0ECF9] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-[#150726]">
                        {v.label}
                        <span className="ml-1.5 text-micro font-medium text-[#9B8CB5]">{v.unit}</span>
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-body-sm font-extrabold text-[#150726]">
                          ₹{v.price.toLocaleString("en-IN")}
                        </span>
                        {v.mrp > v.price && (
                          <span className="text-micro text-[#9B8CB5] line-through">
                            ₹{v.mrp.toLocaleString("en-IN")}
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="text-tiny font-bold text-[#047857]">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddVariant(v.id)}
                      className={`px-4 py-2 rounded-xl text-caption font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        added
                          ? "bg-[#7CB518] text-white"
                          : "bg-[#2D1B69] hover:bg-[#1E1245] text-white active:scale-95"
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Added
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3.5 w-3.5" /> ADD
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Single pack size with shades only */}
          {variants.length === 0 && shades.length > 0 && (
            <button
              onClick={handleAddShade}
              disabled={!effectiveShade}
              className={`w-full py-3 rounded-xl text-body-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                addedKey === "shade"
                  ? "bg-[#7CB518] text-white"
                  : "bg-[#2D1B69] hover:bg-[#1E1245] text-white active:scale-95 disabled:opacity-40"
              }`}
            >
              {addedKey === "shade" ? (
                <><Check className="h-4 w-4" /> Added to Cart</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> Add with {effectiveShade || "Chosen Colour"}</>
              )}
            </button>
          )}
        </div>

        {/* Footer with easy-to-tap close button */}
        <div className="sticky bottom-0 bg-white border-t border-[#F0ECF9] px-4 py-3 flex items-center justify-end rounded-b-2xl z-10 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl border border-[#DDD6EE] text-caption font-bold text-[#6B5B83] hover:text-[#150726] hover:bg-[#F7F4FC] active:scale-98 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { optionsLabel } from "@/lib/pricing";

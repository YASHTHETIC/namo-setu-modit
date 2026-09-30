"use client";

import { useMemo, useState } from "react";
import { X, Check, ShoppingCart, Palette } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import type { DisplayProduct } from "@/lib/pricing";

interface VariantOptionsModalProps {
  open: boolean;
  onClose: () => void;
  product: DisplayProduct;
}

/**
 * HomeRun-style options picker: pack-size rows with per-row Add buttons,
 * plus a colour/shade list for paint products. Adds the exact
 * variant/shade to the cart.
 */
export function VariantOptionsModal({ open, onClose, product }: VariantOptionsModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const [selectedShade, setSelectedShade] = useState<string | null>(null);

  const variants = useMemo(() => product.variants ?? [], [product]);
  const shades = useMemo(() => product.shades ?? [], [product]);

  if (!open) return null;

  const handleAddVariant = (variantId: string) => {
    addItem(product, 1, variantId, selectedShade ?? undefined);
    setAddedKey(`v:${variantId}`);
    setTimeout(() => setAddedKey(null), 1500);
  };

  const handleAddShade = () => {
    if (!selectedShade) return;
    const defaultVariant = variants[0]?.id;
    addItem(product, 1, defaultVariant, selectedShade);
    setAddedKey("shade");
    setTimeout(() => {
      setAddedKey(null);
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] animate-[fadeIn_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#F0ECF9] px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          <h3 className="text-[14px] font-bold text-[#150726] leading-snug pr-6">{product.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F0ECF9] transition-colors flex-shrink-0">
            <X className="h-5 w-5 text-[#9B8CB5]" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {/* Pack-size / variant rows */}
          {variants.map((v) => {
            const key = `v:${v.id}`;
            const added = addedKey === key;
            const discount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
            return (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-[#F0ECF9] p-3 hover:border-[#7CB518]/40 transition-colors">
                {product.images[0] && (
                  <img src={product.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover bg-[#F0ECF9] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#150726]">
                    {v.label}
                    <span className="ml-1.5 text-[11px] font-medium text-[#9B8CB5]">{v.unit}</span>
                  </p>
                  <p className="text-[12px] mt-0.5">
                    {v.mrp > v.price && (
                      <span className="text-[#9B8CB5] line-through mr-1.5">₹{v.mrp.toLocaleString()}</span>
                    )}
                    <span className="font-extrabold text-[#150726]">₹{v.price.toLocaleString()}</span>
                    {discount > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold text-[#E91E63]">{discount}% off</span>
                    )}
                  </p>
                  {v.stockLevel <= 10 && (
                    <p className="text-[10px] font-bold text-[#FF9800]">Only {v.stockLevel} left</p>
                  )}
                </div>
                <button
                  onClick={() => handleAddVariant(v.id)}
                  disabled={v.stockLevel <= 0}
                  className={`px-6 py-2.5 rounded-xl text-[12px] font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    added
                      ? "bg-[#7CB518]/15 text-[#7CB518]"
                      : "bg-[#7CB518] text-white hover:bg-[#6A9C14] active:scale-95 shadow-md shadow-green-500/25"
                  } disabled:opacity-40`}
                >
                  {added ? <><Check className="h-3.5 w-3.5" /> Added</> : "Add"}
                </button>
              </div>
            );
          })}

          {/* Shade / colour list */}
          {shades.length > 0 && (
            <div className="rounded-xl border border-[#F0ECF9] p-3">
              <p className="text-[12px] font-bold text-[#150726] flex items-center gap-1.5 mb-2">
                <Palette className="h-3.5 w-3.5 text-[#2D1B69]" /> Select Colour
                {selectedShade && <span className="font-medium text-[#9B8CB5]">— {selectedShade}</span>}
              </p>
              <div className="max-h-48 overflow-y-auto thin-scroll space-y-1 pr-1">
                {shades.map((sh) => (
                  <button
                    key={sh.name}
                    onClick={() => setSelectedShade(sh.name)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                      selectedShade === sh.name ? "bg-[#F0ECF9] ring-1 ring-[#2D1B69]" : "hover:bg-[#F7F4FC]"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: sh.code }}
                    />
                    <span className="text-[12px] font-semibold text-[#150726]">{sh.name}</span>
                    {selectedShade === sh.name && <Check className="h-4 w-4 text-[#7CB518] ml-auto" />}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddShade}
                disabled={!selectedShade}
                className={`mt-3 w-full py-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                  addedKey === "shade"
                    ? "bg-[#7CB518]/15 text-[#7CB518]"
                    : "bg-[#2D1B69] text-white hover:bg-[#1E1245] active:scale-[0.98] disabled:opacity-40"
                }`}
              >
                {addedKey === "shade" ? <><Check className="h-4 w-4" /> Added to Cart</> : <><ShoppingCart className="h-4 w-4" /> Add Selected Colour</>}
              </button>
            </div>
          )}

          {variants.length === 0 && shades.length === 0 && (
            <p className="text-center text-[12px] text-[#9B8CB5] py-4">No options for this product.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Label + count for the card button, e.g. "4 Options" / "12 Colours". */
export function optionsLabel(product: { variants?: unknown[]; shades?: unknown[]; hasShades?: boolean }): string | null {
  const vCount = product.variants?.length ?? 0;
  const sCount = product.shades?.length ?? 0;
  if (vCount > 1) return `${vCount} Options`;
  if (vCount === 1 && sCount > 0) return `${sCount} Colours`;
  if (sCount > 0) return `${sCount} Colours`;
  return null;
}

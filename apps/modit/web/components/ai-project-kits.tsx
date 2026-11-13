"use client";

import { useState, useMemo, useId } from "react";
import Image from "next/image";
import {
  Sparkles,
  Droplets,
  Paintbrush,
  Lightbulb,
  Grid3X3,
  Layers,
  Check,
  ShoppingCart,
  ArrowRight,
  X,
  Zap,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@foundation/ui";
import { formatINR2 } from "@/lib/utils";
import {
  PROJECT_KITS,
  resolveKit,
  findKitsByQuery,
  type ProjectKit,
  type ResolvedKit,
} from "@/lib/ai-kits";

const ICON_MAP = {
  Droplets,
  Paintbrush,
  Lightbulb,
  Grid3X3,
  Layers,
};

const PROMPT_CHIPS = [
  { label: "💧 Waterproofing", query: "waterproof" },
  { label: "🎨 Room Paint", query: "paint" },
  { label: "💡 False Ceiling", query: "ceiling lighting" },
  { label: "🧱 Wall Plaster", query: "plaster" },
  { label: "🪟 Tile Laying", query: "tile" },
];

export function AiProjectKitsSection() {
  const toast = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const searchInputId = useId();

  const [activeQuery, setActiveQuery] = useState("");
  const [selectedKit, setSelectedKit] = useState<ProjectKit | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [kitQuantities, setKitQuantities] = useState<Record<string, number>>({});
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Resolved list of kits according to search
  const visibleKits = useMemo(() => {
    return findKitsByQuery(activeQuery);
  }, [activeQuery]);

  // When a kit is selected for modal customization
  const activeResolved = useMemo<ResolvedKit | null>(() => {
    if (!selectedKit) return null;
    return resolveKit(selectedKit);
  }, [selectedKit]);

  // Open modal and initialize checked states & default quantities
  const handleOpenKit = (kit: ProjectKit) => {
    const resolved = resolveKit(kit);
    const initialChecked: Record<string, boolean> = {};
    const initialQty: Record<string, number> = {};

    resolved.resolvedItems.forEach((item) => {
      initialChecked[item.product.id] = true;
      initialQty[item.product.id] = item.quantity;
    });

    setCheckedItems(initialChecked);
    setKitQuantities(initialQty);
    setAddedSuccess(false);
    setSelectedKit(kit);
  };

  // Compute live subtotal inside the customization modal
  const modalLiveTotals = useMemo(() => {
    if (!activeResolved) return { total: 0, mrpTotal: 0, count: 0 };
    let total = 0;
    let mrpTotal = 0;
    let count = 0;

    activeResolved.resolvedItems.forEach((item) => {
      const pid = item.product.id;
      if (checkedItems[pid]) {
        const qty = kitQuantities[pid] ?? item.quantity;
        const mrp = item.product.mrp > item.product.price ? item.product.mrp : Math.round(item.product.price * 1.15);
        total += item.product.price * qty;
        mrpTotal += mrp * qty;
        count += 1;
      }
    });

    return { total, mrpTotal, count };
  }, [activeResolved, checkedItems, kitQuantities]);

  // 1-Click "Add Complete Kit to Cart"
  const handleAddKitToCart = () => {
    if (!activeResolved) return;

    let itemsAdded = 0;
    activeResolved.resolvedItems.forEach((item) => {
      const pid = item.product.id;
      if (checkedItems[pid]) {
        const qty = kitQuantities[pid] ?? item.quantity;
        addItem(item.product, qty);
        itemsAdded += 1;
      }
    });

    if (itemsAdded > 0) {
      setAddedSuccess(true);
      toast.success(
        "Project Kit Added to Cart",
        `${itemsAdded} items added. Ready for 60-min delivery.`
      );
      setTimeout(() => {
        setSelectedKit(null);
        setAddedSuccess(false);
      }, 1400);
    }
  };

  return (
    <section aria-label="AI Project Kits" className="w-full pt-4 pb-2 sm:pt-6 sm:pb-4">
      <div className="page-gutter mx-auto w-full max-w-[1600px] lg:w-[84vw] px-4 sm:px-6">
        {/* Section Header with Blinkit-style AI Badge */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D1B69] px-2.5 py-0.5 text-micro font-black text-[#F8CB46] shadow-xs mb-1">
              <Sparkles className="h-3 w-3 text-[#F8CB46] animate-pulse" />
              <span>AI PROJECT KITS · 1-CLICK SITE BUNDLES</span>
            </div>
            <h2 className="text-body-lg sm:text-title-md font-extrabold text-[#150726] tracking-tight">
              Build & Fix Recipes for Your Site
            </h2>
            <p className="text-caption text-[#9B8CB5] mt-0.5">
              Complete pre-calculated material bundles — never miss primer, grout, or blades.
            </p>
          </div>

          {/* Quick AI Prompt Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            <button
              type="button"
              onClick={() => setActiveQuery("")}
              className={`rounded-full px-3 py-1 text-tiny font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeQuery === ""
                  ? "bg-[#2D1B69] text-white shadow-xs"
                  : "bg-[#F0ECF9] text-[#2D1B69] hover:bg-[#DDD6EE]"
              }`}
            >
              All Kits
            </button>
            {PROMPT_CHIPS.map((chip) => {
              const active = activeQuery === chip.query;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setActiveQuery(active ? "" : chip.query)}
                  className={`rounded-full px-3 py-1 text-tiny font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[#2D1B69] text-white shadow-xs"
                      : "bg-[#F0ECF9] text-[#2D1B69] hover:bg-[#DDD6EE]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Intent Search Input */}
        <div className="relative mb-4">
          <label htmlFor={searchInputId} className="sr-only">
            Describe your project or repair needs
          </label>
          <div className="relative flex items-center rounded-2xl border border-[#DDD6EE] bg-white shadow-xs px-3.5 py-2.5 focus-within:border-[#2D1B69] focus-within:ring-2 focus-within:ring-[#2D1B69]/10">
            <Sparkles className="h-4 w-4 text-[#7CB518] flex-shrink-0 mr-2.5" />
            <input
              id={searchInputId}
              type="text"
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
              placeholder="Describe your project (e.g. 'waterproofing', 'paint 1 bedroom', 'false ceiling lights')..."
              className="w-full bg-transparent text-caption sm:text-body-sm font-semibold text-[#150726] placeholder:text-[#9B8CB5] focus:outline-none"
            />
            {activeQuery && (
              <button
                type="button"
                onClick={() => setActiveQuery("")}
                aria-label="Clear project query"
                className="p-1 text-[#9B8CB5] hover:text-[#150726]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Kits Grid / Horizontal Rail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleKits.map((kit) => {
            const Icon = ICON_MAP[kit.iconName] ?? Sparkles;
            const resolved = resolveKit(kit);

            return (
              <div
                key={kit.id}
                className="group relative flex flex-col rounded-2xl border border-[#DDD6EE] bg-white p-4 shadow-xs transition-all hover:border-[#2D1B69] hover:shadow-md"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 shadow-xs"
                      style={{ background: `${kit.accentColor}1A`, border: `1.5px solid ${kit.accentColor}4D` }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color: kit.accentColor }} />
                    </span>
                    <div>
                      <span className="text-micro font-black tracking-wider uppercase text-[#9B8CB5]">
                        {kit.tag}
                      </span>
                      <h3 className="text-body-sm font-extrabold text-[#150726] leading-tight line-clamp-1">
                        {kit.title}
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-micro font-extrabold text-[#2D1B69]">
                    {kit.badge}
                  </span>
                </div>

                <p className="text-micro text-[#6B5B83] line-clamp-2 mb-3">
                  {kit.description}
                </p>

                {/* Items Preview strip (Images of all items in bundle) */}
                <div className="rounded-xl bg-[#F7F4FC] p-2 mb-3">
                  <div className="flex items-center justify-between text-micro font-bold text-[#2D1B69] mb-1.5">
                    <span>Includes {resolved.resolvedItems.length} verified items:</span>
                    <span className="text-[#7CB518] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 60m delivery
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                    {resolved.resolvedItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="relative h-11 w-11 flex-shrink-0 rounded-lg bg-white border border-[#DDD6EE] p-1 shadow-2xs group-hover:border-[#2D1B69]/30"
                        title={`${item.product.name} (${item.role})`}
                      >
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            sizes="44px"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#F0ECF9] rounded text-micro text-[#2D1B69]">
                            {item.quantity}×
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-[#150726] px-1 text-tiny font-black text-white scale-75">
                          {item.quantity}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Price & Action */}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-title-sm font-black text-[#150726] tabular-nums">
                        {formatINR2(resolved.totalBundlePrice)}
                      </span>
                      {resolved.totalMrp > resolved.totalBundlePrice && (
                        <span className="text-caption text-[#9B8CB5] line-through tabular-nums">
                          {formatINR2(resolved.totalMrp)}
                        </span>
                      )}
                    </div>
                    {resolved.savings > 0 && (
                      <span className="text-micro font-bold text-[#7CB518]">
                        Save {formatINR2(resolved.savings)} ({resolved.savingsPct}% off)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenKit(kit)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#7CB518] hover:bg-[#6A9C14] px-3.5 py-2 text-caption font-black text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>View Kit</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Blinkit-Style Kit Customizer Modal */}
      {selectedKit && activeResolved && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-kit-modal-title"
          className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setSelectedKit(null)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[88dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#F0ECF9]">
              <div>
                <div className="inline-flex items-center gap-1 rounded bg-[#2D1B69] px-2 py-0.5 text-micro font-black text-[#F8CB46] mb-1">
                  <Sparkles className="h-3 w-3 text-[#F8CB46]" />
                  <span>AI VERIFIED SITE RECIPE</span>
                </div>
                <h3 id="ai-kit-modal-title" className="text-body-md sm:text-title-sm font-extrabold text-[#150726]">
                  {selectedKit.title}
                </h3>
                <p className="text-micro text-[#9B8CB5] mt-0.5">
                  {selectedKit.coverage} · {selectedKit.estimatedTime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKit(null)}
                aria-label="Close kit modal"
                className="rounded-full p-1.5 text-[#9B8CB5] hover:bg-[#F0ECF9] hover:text-[#150726] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Checklist of Items */}
            <div className="py-3 space-y-2.5">
              <p className="text-micro font-bold text-[#6B5B83] uppercase tracking-wider">
                Uncheck items you already have at your site:
              </p>

              {activeResolved.resolvedItems.map((item) => {
                const pid = item.product.id;
                const isChecked = checkedItems[pid] ?? true;
                const qty = kitQuantities[pid] ?? item.quantity;

                return (
                  <div
                    key={pid}
                    onClick={() => setCheckedItems((prev) => ({ ...prev, [pid]: !prev[pid] }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "border-[#2D1B69]/30 bg-[#F8F6FC]"
                        : "border-[#DDD6EE] bg-white opacity-60"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                        isChecked ? "bg-[#7CB518] text-white" : "border-2 border-[#DDD6EE]"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative h-12 w-12 rounded-lg bg-white border border-[#DDD6EE] p-1 flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          sizes="48px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#F0ECF9] rounded flex items-center justify-center text-micro text-[#2D1B69]">
                          Item
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-tiny font-bold uppercase tracking-wider text-[#7CB518]">
                        {item.role}
                      </span>
                      <p className="text-caption font-bold text-[#150726] truncate">
                        {item.product.name}
                      </p>
                      <p className="text-micro text-[#9B8CB5]">
                        Qty: {qty} × {formatINR2(item.product.price)}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-body-sm font-extrabold text-[#150726]">
                        {formatINR2(item.product.price * qty)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom CTA Bar */}
            <div className="pt-3 border-t border-[#F0ECF9]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-micro text-[#9B8CB5] block">Kit Bundle Total ({modalLiveTotals.count} items):</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-title-md font-black text-[#2D1B69]">
                      {formatINR2(modalLiveTotals.total)}
                    </span>
                    {modalLiveTotals.mrpTotal > modalLiveTotals.total && (
                      <span className="text-caption text-[#9B8CB5] line-through">
                        {formatINR2(modalLiveTotals.mrpTotal)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-micro text-[#7CB518] font-bold flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified 60-min delivery</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddKitToCart}
                disabled={modalLiveTotals.count === 0 || addedSuccess}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#7CB518] hover:bg-[#6A9C14] text-white text-body-sm font-black shadow-lg shadow-green-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <span>Added to Your Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    <span>Add Complete Kit to Cart ({formatINR2(modalLiveTotals.total)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
